import React from "react";
import styles from "./NetworkSwitcher.module.css";

const NetworkSwitcher = () => {
  const currentHost = window.location.hostname;

  // Determine current network based on subdomain
  const getCurrentNetwork = () => {
    if (currentHost.includes("lynx")) return "lynx";
    if (currentHost.includes("tapir")) return "tapir";
    return "mainnet";
  };

  const currentNetwork = getCurrentNetwork();

  const networks = [
    {
      name: "Mainnet",
      url: import.meta.env.VITE_MAINNET_URL || "https://tacoscan.io",
      color: "#10B981",
      description: "Mainnet",
    },
    {
      name: "Lynx",
      url: import.meta.env.VITE_LYNX_URL || "https://lynx.tacoscan.io",
      color: "#FBBf24",
      description: "Lynx Testnet",
    },
    {
      name: "Tapir",
      url: import.meta.env.VITE_TAPIR_URL || "https://tapir.tacoscan.io",
      color: "#8B5CF6",
      description: "Tapir Testnet",
    },
  ];

  const handleNetworkSwitch = (url) => {
    // Preserve the current page path when switching networks
    const currentPath = window.location.pathname;
    const baseUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    window.location.href = baseUrl + currentPath;
  };

  return (
    <div className={styles.networkSwitcher}>
      <div className={styles.label}>Networks:</div>
      {networks.map((network) => {
        const isActive =
          (network.name.toLowerCase() === "mainnet" &&
            currentNetwork === "mainnet") ||
          network.name.toLowerCase() === currentNetwork;

        return (
          <button
            key={network.name}
            className={`${styles.networkButton} ${isActive ? styles.active : ""}`}
            onClick={() => handleNetworkSwitch(network.url)}
            title={network.description}
            style={{
              "--network-color": network.color,
            }}
            disabled={isActive}
          >
            <span
              className={styles.dot}
              style={{ backgroundColor: network.color }}
            />
            {network.name}
          </button>
        );
      })}
    </div>
  );
};

export default NetworkSwitcher;
