// Batch processor for Web3 calls to prevent overwhelming the RPC endpoint
class BatchProcessor {
  constructor(maxConcurrent = 2, delayBetweenBatches = 500) {
    this.maxConcurrent = maxConcurrent;
    this.delayBetweenBatches = delayBetweenBatches;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async processBatch(items, processor) {
    const results = [];
    
    // Process items in chunks
    for (let i = 0; i < items.length; i += this.maxConcurrent) {
      const batch = items.slice(i, i + this.maxConcurrent);
      
      // Process batch concurrently
      const batchResults = await Promise.all(
        batch.map(item => processor(item).catch(error => {
          console.error('Batch processing error:', error);
          return null; // Return null for failed items
        }))
      );
      
      results.push(...batchResults);
      
      // Add delay between batches to avoid rate limiting
      if (i + this.maxConcurrent < items.length) {
        await this.delay(this.delayBetweenBatches);
      }
    }
    
    return results;
  }
}

export default BatchProcessor;