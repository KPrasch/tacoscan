// Script to fetch and identify access controller contracts from the network
// Run this to populate the registry with real contract addresses

const fetch = require('node-fetch');

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/78314/taco-subgraph-polygon/version/latest';

async function fetchAccessControllers() {
  const query = `
    query GetAccessControllers {
      rituals(first: 100) {
        id
        accessController
      }
    }
  `;

  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    
    // Collect unique access controller addresses
    const accessControllers = new Map();
    
    data.data.rituals.forEach(ritual => {
      if (ritual.accessController) {
        const address = ritual.accessController.toLowerCase();
        if (!accessControllers.has(address)) {
          accessControllers.set(address, {
            address: ritual.accessController,
            count: 1,
            ritualIds: [ritual.id]
          });
        } else {
          const existing = accessControllers.get(address);
          existing.count++;
          existing.ritualIds.push(ritual.id);
        }
      }
    });
    
    console.log('Found Access Controller Contracts:');
    console.log('==================================');
    
    // Sort by usage count
    const sorted = Array.from(accessControllers.values()).sort((a, b) => b.count - a.count);
    
    sorted.forEach(controller => {
      console.log(`\nAddress: ${controller.address}`);
      console.log(`Used by ${controller.count} ritual(s)`);
      console.log(`Ritual IDs: ${controller.ritualIds.slice(0, 5).join(', ')}${controller.ritualIds.length > 5 ? '...' : ''}`);
    });
    
    // Generate code for the registry
    console.log('\n\nRegistry Code:');
    console.log('==============');
    sorted.forEach(controller => {
      console.log(`  '${controller.address}': {`);
      console.log(`    name: 'Contract_${controller.address.slice(0, 8)}',`);
      console.log(`    displayName: 'Access Controller',`);
      console.log(`    type: 'unknown',`);
      console.log(`    description: 'Access controller used by ${controller.count} ritual(s)'`);
      console.log(`  },`);
    });
    
  } catch (error) {
    console.error('Error fetching access controllers:', error);
  }
}

fetchAccessControllers();