// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TicketNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint256 private _eventIds;

    struct Event {
        string name;
        uint256 originalPrice;
        uint256 maxResalePrice;
        uint256 royaltyPercentage;
        bool active;
        address organizer;
        string eventURI;
        uint256 eventId; // ✅ Added eventId inside the Event struct
    }

    struct TicketOwner {
        address owner;
        uint256 price;
        bool forSale;
    }

    struct Ticket {
        uint256 tokenId;        // ✅ Added tokenId inside Ticket struct
        uint256 eventId;
        uint256 originalPrice;
        TicketOwner[] owners;
    }

    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;

    uint256[] public eventList;
    uint256[] public listedTickets;

    event EventCreated(uint256 eventId, string name, uint256 price, string eventURI);
    event EventDeleted(uint256 eventId);
    event TicketMinted(uint256 tokenId, uint256 eventId, address owner);
    event TicketListed(uint256 tokenId, address owner, uint256 price);
    event TicketSold(uint256 tokenId, address from, address to, uint256 price);

    constructor() ERC721("Event Ticket", "TIKT") Ownable(msg.sender) {}

    function createEvent(
        string memory name,
        uint256 price,
        uint256 maxResalePrice,
        uint256 royaltyPercentage,
        string memory eventURI
    ) public returns (uint256) {
        require(royaltyPercentage <= 25, "Royalty cannot exceed 25%");

        _eventIds++;
        events[_eventIds] = Event({
            name: name,
            originalPrice: price * 10**18,
            maxResalePrice: maxResalePrice * 10**18,
            royaltyPercentage: royaltyPercentage,
            active: true,
            organizer: msg.sender,
            eventURI: eventURI,
            eventId: _eventIds
        });
        eventList.push(_eventIds);

        emit EventCreated(_eventIds, name, price * 10**18, eventURI);
        return _eventIds;
    }

    function deleteEvent(uint256 eventId) public onlyOwner {
        require(events[eventId].active, "Event does not exist or is already deleted");
        delete events[eventId];
        emit EventDeleted(eventId);
    }

    function showEvents() public view returns (Event[] memory) {
        uint256 length = eventList.length;
        Event[] memory eventDetails = new Event[](length);

        for (uint256 i = 0; i < length; i++) {
            eventDetails[i] = events[eventList[i]];
        }
        return eventDetails;
    }

    function getEventList() public view returns (uint256[] memory) {
        return eventList;
    }

    function mintTicket(uint256 eventId) public payable returns (uint256) {
        Event storage eventDetails = events[eventId];
        require(eventDetails.active, "Event does not exist or is not active");
        require(msg.value >= eventDetails.originalPrice, "Insufficient payment");

        if (msg.value > eventDetails.originalPrice) {
            payable(msg.sender).transfer(msg.value - eventDetails.originalPrice);
        }
        payable(eventDetails.organizer).transfer(eventDetails.originalPrice);

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, eventDetails.eventURI);

        tickets[newTokenId].tokenId = newTokenId;
        tickets[newTokenId].eventId = eventId;
        tickets[newTokenId].originalPrice = eventDetails.originalPrice;
        tickets[newTokenId].owners.push(TicketOwner({
            owner: msg.sender,
            price: eventDetails.originalPrice,
            forSale: false
        }));

        emit TicketMinted(newTokenId, eventId, msg.sender);
        return newTokenId;
    }

    function listTicket(uint256 tokenId, uint256 price) public {
        Ticket storage ticket = tickets[tokenId];
        require(ticket.tokenId != 0, "Ticket does not exist");

        for (uint256 i = 0; i < ticket.owners.length; i++) {
            if (ticket.owners[i].owner == msg.sender) {
                require(!ticket.owners[i].forSale, "Ticket is already listed");
                require(price <= events[ticket.eventId].maxResalePrice, "Price exceeds max resale value");

                ticket.owners[i].forSale = true;
                ticket.owners[i].price = price;
                listedTickets.push(tokenId);

                emit TicketListed(tokenId, msg.sender, price);
                return;
            }
        }
        revert("You do not own this ticket");
    }

    function buyTicket(uint256 tokenId) public payable {
        Ticket storage ticket = tickets[tokenId];
        require(ticket.tokenId != 0, "Ticket does not exist");

        for (uint256 i = 0; i < ticket.owners.length; i++) {
            if (ticket.owners[i].forSale) {
                require(msg.value >= ticket.owners[i].price, "Insufficient payment");

                address seller = ticket.owners[i].owner;
                uint256 price = ticket.owners[i].price;
                uint256 royalty = (price * events[ticket.eventId].royaltyPercentage) / 100;
                uint256 sellerProceeds = price - royalty;

                payable(events[ticket.eventId].organizer).transfer(royalty);
                payable(seller).transfer(sellerProceeds);

                ticket.owners[i].owner = msg.sender;
                ticket.owners[i].forSale = false;

                // Remove from listedTickets
                for (uint256 j = 0; j < listedTickets.length; j++) {
                    if (listedTickets[j] == tokenId) {
                        listedTickets[j] = listedTickets[listedTickets.length - 1];
                        listedTickets.pop();
                        break;
                    }
                }

                emit TicketSold(tokenId, seller, msg.sender, price);
                return;
            }
        }
        revert("Ticket is not for sale");
    }

    function showListedTickets() public view returns (uint256[] memory) {
        return listedTickets;
    }

    function getTicketOwners(uint256 tokenId) public view returns (TicketOwner[] memory) {
        return tickets[tokenId].owners;
    }
}
