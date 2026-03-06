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
    { id: "mainnet", name: "Mainnet", url: "https://tacoscan.io",      color: "#10B981", description: "Mainnet" },
    { id: "lynx",    name: "Lynx",    url: "https://lynx.tacoscan.io", color: "#FBBf24", description: "Lynx Testnet" },
    { id: "tapir",   name: "Tapir",   url: "https://tapir.tacoscan.io",color: "#8B5CF6", description: "Tapir Testnet" },
  ];

  const handleNetworkSwitch = (url) => {
    const currentPath = window.location.pathname;
    const baseUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    window.location.href = baseUrl + currentPath;
  };

  return (
    <div className={styles.networkSwitcher}>
      <div className={styles.label}>Networks:</div>
      {networks.map((network) => {
        const isActive = network.id === currentNetwork;

        return (
          <button
            key={network.id}
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
