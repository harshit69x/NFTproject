const TicketNFT = artifacts.require("TicketNFT");

contract("TicketNFT", (accounts) => {
    let contractInstance;
    const owner = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];

    let eventId;
    let tokenId;
    let eventDetails; // Store event details globally

    before(async () => {
        contractInstance = await TicketNFT.new({ from: owner });
    });

    it("should create an event and return details", async () => {
        const eventName = "Concert";
        const price = web3.utils.toWei("0.1", "ether"); // ✅ Convert price to Wei
        const maxResalePrice = web3.utils.toWei("0.2", "ether");
        const royalty = 10; // 10%

        const tx = await contractInstance.createEvent(
            eventName,
            price,
            maxResalePrice,
            royalty,
            "ipfs://event-uri",
            { from: owner }
        );

        assert(tx.logs.length > 0, "No event created.");
        
        const eventLog = tx.logs.find(log => log.event === "EventCreated");
        eventId = eventLog.args.eventId.toNumber();
        console.log(`✅ Event Created with ID: ${eventId}`);

        // Fetch event details and store
        eventDetails = await contractInstance.events(eventId);
        console.log("🔍 Event Details:", eventDetails);

        assert.equal(eventDetails.name, eventName, "Event name mismatch");
        assert.equal(eventDetails.originalPrice.toString(), price, "Event price mismatch");
    });

    it("should return event details", async () => {
        assert(eventDetails, "Event details were not stored.");
        console.log("📜 Returned Event Details:", eventDetails);
    });

    it("should show active events", async () => {
        const activeEvents = await contractInstance.showEvents();
        assert.equal(activeEvents.length, 1, "Should have one active event");
        assert.equal(activeEvents[0].name, "Concert", "Event name mismatch");
    });

    it("should mint a ticket", async () => {
        const eventDetails = await contractInstance.events(eventId);
        assert(eventDetails.active, "Event is inactive or does not exist");

        const price = eventDetails.originalPrice.toString();
        console.log(`💰 Ticket Minting Price: ${price}`);

        try {
            const tx = await contractInstance.mintTicket(eventId, {
                from: user1,
                value: price, // ✅ Ensure price is correctly converted
            });

            assert(tx.logs.length > 0, "No ticket minted.");

            const mintLog = tx.logs.find(log => log.event === "TicketMinted");
            assert(mintLog, "TicketMinted event not found.");

            tokenId = mintLog.args.tokenId.toNumber();
            console.log(`🎟️ Ticket Minted with ID: ${tokenId}`);
        } catch (error) {
            console.error("❌ Ticket Minting Failed:", error.message);
            assert.fail("Ticket minting transaction failed.");
        }
    });

    it("should list a ticket for resale", async () => {
        assert(tokenId > 0, "Token ID is not set, minting might have failed.");

        const resalePrice = web3.utils.toWei("0.15", "ether");
        await contractInstance.listTicket(tokenId, resalePrice, { from: user1 });

        // Fetch ticket owners and check listing
        const ticketOwners = await contractInstance.getTicketOwners(tokenId);
        assert(ticketOwners.length > 0, "No ticket owner found.");
        assert(ticketOwners[0].forSale, "Ticket should be listed for sale");
        assert.equal(ticketOwners[0].price.toString(), resalePrice, "Resale price mismatch");

        // Check listed tickets
        const listedTickets = await contractInstance.showListedTickets();
        assert.equal(listedTickets.length, 1, "Listed tickets should have one entry");
        console.log(`📢 Ticket ID ${tokenId} listed for resale at ${resalePrice} Wei.`);
    });
});
