  const fetchOwnedTickets = async (contractInst = contractInstance) => {
    try {
      setLoading(true);
      
      if (!contractInst || !account) {
        setLoading(false);
        return;
      }

      console.log("Fetching owned tickets for account:", account);
        
      // Get all events
      const allEvents = await contractInst.methods.showEvents().call();
      console.log("All events:", allEvents);
      
      if (!allEvents || allEvents.length === 0) {
        setOwnedTickets([]);
        setLoading(false);
        return;
      }

      const ownedTickets = [];
      
      // Check token IDs 1-50 for ownership (reasonable limit)
      for (let tokenId = 1; tokenId <= 50; tokenId++) {
        try {
          const owner = await contractInst.methods.ownerOf(tokenId).call();
          
          if (owner && owner.toLowerCase() === account.toLowerCase()) {
            const ticket = await contractInst.methods.tickets(tokenId).call();
            
            if (ticket && ticket.eventId && ticket.eventId !== '0') {
              const eventDetails = allEvents.find((event: any) => event.eventId === ticket.eventId);
              
              if (eventDetails) {
                const ticketOwners = await contractInst.methods.getTicketOwners(tokenId).call();
                const currentOwnerData = ticketOwners.find(
                  (ownerData: any) => ownerData.owner.toLowerCase() === account.toLowerCase()
                );
                
                let image = "";
                try {
                  if (eventDetails.eventURI && eventDetails.eventURI.startsWith('http')) {
                    const response = await fetch(eventDetails.eventURI);
                    if (response.ok) {
                      const data = await response.json();
                      if (data.image) {
                        image = data.image.trim().replace(/\n/g, "");
                      }
                    }
                  }
                } catch (error) {
                  console.warn(`Error fetching eventURI:`, error);
                }
                
                ownedTickets.push({
                  id: tokenId,
                  eventId: parseInt(eventDetails.eventId),
                  eventName: eventDetails.name,
                  originalPrice: Web3.utils.fromWei(eventDetails.originalPrice, "ether"),
                  forSale: currentOwnerData?.forSale || false,
                  listingPrice: currentOwnerData?.forSale 
                    ? Web3.utils.fromWei(currentOwnerData.price, "ether") 
                    : undefined,
                  image,
                });
              }
            }
          }
        } catch (error: any) {
          if (!error.message?.includes("ERC721: invalid token ID")) {
            console.warn(`Error checking token ${tokenId}:`, error);
          }
        }
      }
      
      console.log(`🎫 Found ${ownedTickets.length} owned tickets:`, ownedTickets);
      setOwnedTickets(ownedTickets);
    } catch (error) {
      console.error("Error fetching owned tickets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your tickets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };