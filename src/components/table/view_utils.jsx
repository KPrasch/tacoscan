export function getColorByStatus(status) {
  if (
    status === "DKG AWAITING TRANSCRIPTS" ||
    status === "Start Ritual"
  ) {
    return "#3B82F6"; // Blue for pending
  } else if (status === "DKG AWAITING AGGREGATIONS" || status === "Posted Transcripts") {
    return "#96FF5E"; // TACo green for in-progress
  } else if (
    status === "SUCCESSFUL" || status === "Posted Aggregations"
  ) {
    return "#10B981"; // Success green
  } else if (
    status === "UNSUCCESSFUL" 
  ) {
    return "#EF4444"; // Error red
  } else {
    return "#6B7280"; // Gray for default
  }
}
