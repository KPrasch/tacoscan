// Node categorization utilities

export const NodeStatus = {
  ACTIVE_CONFIRMED: 'active_confirmed',
  PENDING_CONFIRMATION: 'pending_confirmation',
  AUTHORIZED_NO_OPERATOR: 'authorized_no_operator',
  DEAUTHORIZED_WITH_OPERATOR: 'deauthorized_with_operator',
  DEAUTHORIZED_NO_OPERATOR: 'deauthorized_no_operator'
};

export const NodeStatusLabels = {
  [NodeStatus.ACTIVE_CONFIRMED]: 'Active Confirmed',
  [NodeStatus.PENDING_CONFIRMATION]: 'Pending Confirmation',
  [NodeStatus.AUTHORIZED_NO_OPERATOR]: 'Never Set Operator',
  [NodeStatus.DEAUTHORIZED_WITH_OPERATOR]: 'Deauthorized',
  [NodeStatus.DEAUTHORIZED_NO_OPERATOR]: 'Never Started'
};

export const NodeStatusIcons = {
  [NodeStatus.ACTIVE_CONFIRMED]: '●',
  [NodeStatus.PENDING_CONFIRMATION]: '●',
  [NodeStatus.AUTHORIZED_NO_OPERATOR]: '●',
  [NodeStatus.DEAUTHORIZED_WITH_OPERATOR]: '●',
  [NodeStatus.DEAUTHORIZED_NO_OPERATOR]: '●'
};

export const NodeStatusColors = {
  [NodeStatus.ACTIVE_CONFIRMED]: '#96FF5E',  // TACo green
  [NodeStatus.PENDING_CONFIRMATION]: '#FBBf24',  // Yellow/warning
  [NodeStatus.AUTHORIZED_NO_OPERATOR]: '#EF4444',  // Red for never set
  [NodeStatus.DEAUTHORIZED_WITH_OPERATOR]: '#8B5CF6',  // Purple for deauthorized  
  [NodeStatus.DEAUTHORIZED_NO_OPERATOR]: '#F59E0B'  // Orange for never started
};

/**
 * Categorize a single node based on its authorization status
 */
export function categorizeNode(authorization) {
  const hasAmount = authorization.amount && Number(authorization.amount) > 0;
  const hasOperator = authorization.tacoOperator?.operator;
  const isConfirmed = authorization.tacoOperator?.confirmed === true;
  // deauthorization field may not exist in all subgraphs
  const hasDeauthorization = authorization.deauthorization && Number(authorization.deauthorization) > 0;
  
  // Active nodes (have authorization amount)
  if (hasAmount) {
    if (hasOperator) {
      if (isConfirmed) {
        return NodeStatus.ACTIVE_CONFIRMED;
      } else {
        return NodeStatus.PENDING_CONFIRMATION;
      }
    } else {
      return NodeStatus.AUTHORIZED_NO_OPERATOR;
    }
  }
  
  // Deauthorized nodes (no authorization amount)
  if (hasDeauthorization || !hasAmount) {
    if (hasOperator) {
      return NodeStatus.DEAUTHORIZED_WITH_OPERATOR;
    } else {
      return NodeStatus.DEAUTHORIZED_NO_OPERATOR;
    }
  }
  
  // Default fallback
  return NodeStatus.DEAUTHORIZED_NO_OPERATOR;
}

/**
 * Categorize all nodes and return counts and lists
 */
export function categorizeAllNodes(authorizations) {
  const categories = {
    [NodeStatus.ACTIVE_CONFIRMED]: [],
    [NodeStatus.PENDING_CONFIRMATION]: [],
    [NodeStatus.AUTHORIZED_NO_OPERATOR]: [],
    [NodeStatus.DEAUTHORIZED_WITH_OPERATOR]: [],
    [NodeStatus.DEAUTHORIZED_NO_OPERATOR]: []
  };
  
  const counts = {
    [NodeStatus.ACTIVE_CONFIRMED]: 0,
    [NodeStatus.PENDING_CONFIRMATION]: 0,
    [NodeStatus.AUTHORIZED_NO_OPERATOR]: 0,
    [NodeStatus.DEAUTHORIZED_WITH_OPERATOR]: 0,
    [NodeStatus.DEAUTHORIZED_NO_OPERATOR]: 0
  };
  
  authorizations.forEach(auth => {
    const status = categorizeNode(auth);
    categories[status].push(auth);
    counts[status]++;
  });
  
  // Calculate totals
  const totalNodes = authorizations.length;
  const activeNodes = counts[NodeStatus.ACTIVE_CONFIRMED] + 
                     counts[NodeStatus.PENDING_CONFIRMATION] + 
                     counts[NodeStatus.AUTHORIZED_NO_OPERATOR];
  const inactiveNodes = totalNodes - activeNodes;
  
  return {
    categories,
    counts,
    totals: {
      total: totalNodes,
      active: activeNodes,
      inactive: inactiveNodes,
      confirmed: counts[NodeStatus.ACTIVE_CONFIRMED]
    }
  };
}

/**
 * Get node lifecycle events from stake history
 */
export function getNodeLifecycle(authorization) {
  const events = [];
  
  // Add stake history events
  if (authorization.stake?.stakeHistory) {
    authorization.stake.stakeHistory.forEach(event => {
      events.push({
        type: event.eventType,
        timestamp: event.timestamp,
        amount: event.eventAmount,
        description: `${event.eventType}: ${event.eventAmount}`,
        category: 'stake'
      });
    });
  }
  
  // Add operator events
  if (authorization.tacoOperator?.bondedTimestampFirstOperator) {
    events.push({
      type: 'operator_registered',
      timestamp: authorization.tacoOperator.bondedTimestampFirstOperator,
      description: 'Operator first registered',
      category: 'operator'
    });
  }
  
  if (authorization.tacoOperator?.bondedTimestamp) {
    events.push({
      type: 'operator_bonded',
      timestamp: authorization.tacoOperator.bondedTimestamp,
      description: 'Operator bonded',
      category: 'operator'
    });
  }
  
  if (authorization.tacoOperator?.confirmed) {
    events.push({
      type: 'operator_confirmed',
      timestamp: authorization.tacoOperator.bondedTimestamp, // Use bonded timestamp as proxy
      description: 'Operator confirmed',
      category: 'operator'
    });
  }
  
  // Add deauthorization event (field may not exist in all subgraphs)
  if (authorization.deauthorization && Number(authorization.deauthorization) > 0) {
    events.push({
      type: 'deauthorized',
      timestamp: authorization.deauthorization,
      description: 'Node deauthorized',
      category: 'authorization'
    });
  }
  
  // Sort events by timestamp
  events.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  
  return events;
}

/**
 * Filter nodes by status
 */
export function filterNodesByStatus(authorizations, status) {
  if (status === 'all') return authorizations;
  
  return authorizations.filter(auth => {
    const nodeStatus = categorizeNode(auth);
    return nodeStatus === status;
  });
}