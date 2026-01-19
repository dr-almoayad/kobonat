// utils/dataConsistency.js
export function ensureDataConsistency(serverData, clientData) {
  if (!clientData || clientData.length === 0) {
    return serverData;
  }
  
  // Check if client data looks stale (has older timestamps or missing fields)
  const serverHasNewerData = serverData.some(serverItem => {
    const clientItem = clientData.find(c => c.storeId === serverItem.storeId);
    if (!clientItem) return true;
    
    // Compare prices - if server has lower price, use it
    const serverPrice = parseFloat(serverItem.price);
    const clientPrice = parseFloat(clientItem.price);
    
    return serverPrice < clientPrice;
  });
  
  return serverHasNewerData ? serverData : clientData;
}