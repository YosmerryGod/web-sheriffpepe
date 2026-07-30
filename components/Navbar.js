"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ArrowDown, Loader2 } from "lucide-react";
import { ethers } from "ethers";
import { NAV_LINKS, SWAP_CONFIG, TOKEN_INFO } from "../lib/config";
import styles from "./Navbar.module.css";

// ---------------------------------------------------------------------------
// Robinhood Chain (mainnet) network params — used for wallet_addEthereumChain
// Source: https://robinhood.com/us/en/support/articles/robinhood-chain-mainnet/
// ---------------------------------------------------------------------------
const ROBINHOOD_CHAIN = {
  chainIdHex: "0x1237", // 4663
  chainIdDec: 4663,
  chainName: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
};

// Minimal ERC-20 ABI, just enough to read balance/decimals for the "to" token.
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// ---------------------------------------------------------------------------
// Flap.sh Portal contract on Robinhood Chain (mainnet, Portal v5.14.16).
// Source: https://docs.flap.sh/flap/developers/deployed-contract-addresses
// This is the bonding-curve contract every flap-launched token trades
// against until it migrates to a DEX.
// ---------------------------------------------------------------------------
const FLAP_PORTAL_ADDRESS = "0x26605f322f7fF986f381bB9A6e3f5DAb0bEaEb09";

const PORTAL_ABI = [
  "function getTokenV2(address token) view returns (tuple(uint8 status, uint256 reserve, uint256 circulatingSupply, uint256 price, uint8 tokenVersion, uint256 r, uint256 dexSupplyThresh))",
  "function quoteExactInput(tuple(address inputToken, address outputToken, uint256 inputAmount) params) returns (uint256 outputAmount)",
  "function swapExactInput(tuple(address inputToken, address outputToken, uint256 inputAmount, uint256 minOutputAmount, bytes permitData) params) payable returns (uint256 outputAmount)",
];

// enum TokenStatus { Invalid, Tradable, InDuel, Killed, DEX }
const TOKEN_STATUS = { INVALID: 0, TRADABLE: 1, IN_DUEL: 2, KILLED: 3, DEX: 4 };

// Turns "1%" / "1" / 1 into basis points (100)
function parseSlippageBps(slippageValue, fallbackBps = 100) {
  const numeric = parseFloat(String(slippageValue).replace("%", "").trim());
  if (Number.isNaN(numeric)) return fallbackBps;
  return Math.round(numeric * 100);
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const dropdownRef = useRef(null);
  const lastScrollY = useRef(0);
  const scrollTicking = useRef(false);

  // --- Wallet / on-chain state -------------------------------------------
  const [account, setAccount] = useState(null);
  const [isCorrectChain, setIsCorrectChain] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [ethBalance, setEthBalance] = useState(null); // native ETH balance (string)
  const [tokenBalance, setTokenBalance] = useState(null); // SHERIFF balance (string)
  const [amountIn, setAmountIn] = useState("0.5");
  const [isSwapping, setIsSwapping] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -------------------------------------------------------------------------
  // Hide navbar when scrolling down, reveal it again when scrolling up.
  // Small threshold near the top always keeps it visible so it doesn't
  // flicker on tiny scroll jitters right at the top of the page.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const SCROLL_THRESHOLD = 80; // px from top where navbar always stays visible
    const DELTA = 6; // ignore tiny scroll jitter below this many px

    function onScroll() {
      if (scrollTicking.current) return;
      scrollTicking.current = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastScrollY.current;

        if (currentY <= SCROLL_THRESHOLD) {
          setIsNavHidden(false);
        } else if (Math.abs(diff) > DELTA) {
          setIsNavHidden(diff > 0);
          // close any open menus so they don't hover off-screen
          if (diff > 0) {
            setDropdownOpen(false);
            setIsOpen(false);
          }
        }

        lastScrollY.current = currentY;
        scrollTicking.current = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleDrawer = () => setIsOpen(!isOpen);
  const closeDrawer = () => setIsOpen(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleMobileBuyNow = () => {
    setIsOpen(false);
    setTimeout(() => {
      setShowSwapModal(true);
    }, 300);
  };

  const closeSwapModal = () => setShowSwapModal(false);

  const { fromToken, toToken, rate, slippage } = SWAP_CONFIG;

  // -------------------------------------------------------------------------
  // Ensure the wallet is on Robinhood Chain. Tries wallet_switchEthereumChain
  // first; if the chain hasn't been added to the wallet yet (error 4902),
  // falls back to wallet_addEthereumChain.
  // -------------------------------------------------------------------------
  const ensureRobinhoodChain = useCallback(async (ethereum) => {
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ROBINHOOD_CHAIN.chainIdHex }],
      });
      return true;
    } catch (switchError) {
      // 4902 = chain not added to wallet yet
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ROBINHOOD_CHAIN.chainIdHex,
                chainName: ROBINHOOD_CHAIN.chainName,
                nativeCurrency: ROBINHOOD_CHAIN.nativeCurrency,
                rpcUrls: ROBINHOOD_CHAIN.rpcUrls,
                blockExplorerUrls: ROBINHOOD_CHAIN.blockExplorerUrls,
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Gagal menambahkan Robinhood Chain:", addError);
          setWalletError("Gagal menambahkan jaringan Robinhood Chain ke wallet.");
          return false;
        }
      }
      console.error("Gagal switch network:", switchError);
      setWalletError("Kamu perlu switch ke jaringan Robinhood Chain untuk melanjutkan.");
      return false;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Fetch native ETH balance + SHERIFF token balance for the connected wallet
  // -------------------------------------------------------------------------
  const refreshBalances = useCallback(async (address) => {
    if (!window.ethereum || !address) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const rawEthBalance = await provider.getBalance(address);
      setEthBalance(ethers.formatEther(rawEthBalance));

      // TODO: set TOKEN_INFO.tokenAddress to the real SHERIFF contract
      // address on Robinhood Chain in lib/config.js
      if (TOKEN_INFO?.tokenAddress) {
        const tokenContract = new ethers.Contract(
          TOKEN_INFO.tokenAddress,
          ERC20_ABI,
          provider
        );
        const [rawTokenBalance, decimals] = await Promise.all([
          tokenContract.balanceOf(address),
          tokenContract.decimals(),
        ]);
        setTokenBalance(ethers.formatUnits(rawTokenBalance, decimals));
      }
    } catch (err) {
      console.error("Gagal mengambil saldo:", err);
      setWalletError("Gagal mengambil saldo dari jaringan.");
    }
  }, []);

  // -------------------------------------------------------------------------
  // Connect wallet, force Robinhood Chain, then pull real balances
  // -------------------------------------------------------------------------
  const connectWallet = useCallback(async () => {
    setWalletError("");

    if (typeof window === "undefined" || !window.ethereum) {
      setWalletError("Wallet EVM (MetaMask / Robinhood Wallet, dll) tidak terdeteksi.");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const address = accounts[0];
      setAccount(address);

      const onCorrectChain = await ensureRobinhoodChain(window.ethereum);
      setIsCorrectChain(onCorrectChain);

      if (onCorrectChain) {
        await refreshBalances(address);
      }
    } catch (err) {
      console.error("Gagal connect wallet:", err);
      if (err.code === 4001) {
        setWalletError("Koneksi wallet dibatalkan.");
      } else {
        setWalletError("Gagal menghubungkan wallet.");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [ensureRobinhoodChain, refreshBalances]);

  // React to account/network changes made from inside the wallet extension
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setEthBalance(null);
        setTokenBalance(null);
      } else {
        setAccount(accounts[0]);
        refreshBalances(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      const onChain = chainIdHex?.toLowerCase() === ROBINHOOD_CHAIN.chainIdHex;
      setIsCorrectChain(onChain);
      if (onChain && account) refreshBalances(account);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [account, refreshBalances]);

  // -------------------------------------------------------------------------
  // Execute the actual swap on-chain against the Flap bonding curve.
  //
  // Flow: connect -> ensure Robinhood Chain -> read token status from the
  // Portal -> if still bonding-curve ("Tradable"), get a live quote and buy
  // via swapExactInput -> if already migrated to a DEX, flap's Portal no
  // longer routes the trade (per Flap's own docs), so we stop and tell the
  // user instead of guessing at Uniswap v4/UniversalRouter calldata blind.
  // -------------------------------------------------------------------------
  const handleSwap = async () => {
    setWalletError("");
    setTxHash(null);

    if (!account) {
      await connectWallet();
      return;
    }
    if (!isCorrectChain) {
      const ok = await ensureRobinhoodChain(window.ethereum);
      setIsCorrectChain(ok);
      if (!ok) return;
    }
    if (!TOKEN_INFO?.tokenAddress) {
      setWalletError(
        "Alamat contract token SHERIFF belum diisi (TOKEN_INFO.tokenAddress di lib/config.js). Isi setelah token dibuat lewat Flap."
      );
      return;
    }

    const value = ethers.parseEther(amountIn || "0");
    if (value <= 0n) {
      setWalletError("Masukkan jumlah ETH yang valid.");
      return;
    }

    try {
      setIsSwapping(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const portal = new ethers.Contract(FLAP_PORTAL_ADDRESS, PORTAL_ABI, signer);

      // 1. Check whether the token is still on the bonding curve or has
      //    already migrated to a DEX pool.
      const state = await portal.getTokenV2.staticCall(TOKEN_INFO.tokenAddress);
      const status = Number(state.status);

      if (status === TOKEN_STATUS.DEX) {
        setWalletError(
          "Token sudah migrasi ke Uniswap (pasca-bonding curve). Flap Portal tidak lagi meng-handle swap untuk token yang sudah di DEX, jadi butuh integrasi Uniswap v4 / UniversalRouter terpisah — kirim alamat pool/router resmi setelah migrasi dan aku wire-kan. Sementara ini kamu bisa swap manual lewat app.uniswap.org (chain: Robinhood, chainId 4663)."
        );
        return;
      }
      if (status !== TOKEN_STATUS.TRADABLE) {
        setWalletError(`Token belum bisa ditradingkan saat ini (status contract: ${status}).`);
        return;
      }

      // 2. Get a live quote from the bonding curve (buying with native ETH).
      const quotedOut = await portal.quoteExactInput.staticCall({
        inputToken: ethers.ZeroAddress,
        outputToken: TOKEN_INFO.tokenAddress,
        inputAmount: value,
      });

      if (quotedOut === 0n) {
        setWalletError("Quote dari bonding curve kosong. Coba jumlah lain.");
        return;
      }

      // 3. Apply slippage tolerance from SWAP_CONFIG.slippage (e.g. "1%").
      const slippageBps = parseSlippageBps(slippage);
      const minOutputAmount = (quotedOut * BigInt(10000 - slippageBps)) / 10000n;

      // 4. Execute the buy.
      const tx = await portal.swapExactInput(
        {
          inputToken: ethers.ZeroAddress,
          outputToken: TOKEN_INFO.tokenAddress,
          inputAmount: value,
          minOutputAmount,
          permitData: "0x",
        },
        { value }
      );
      setTxHash(tx.hash);
      await tx.wait();

      await refreshBalances(account);
    } catch (err) {
      console.error("Swap gagal:", err);
      setWalletError(err?.shortMessage || err?.reason || err?.message || "Transaksi swap gagal.");
    } finally {
      setIsSwapping(false);
    }
  };

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : null;

  // ETH Logo SVG
  const EthLogo = () => (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
      <path d="M15.925 23.96L8.5 19.1l7.425 10.68 7.425-10.68-7.425 4.86z" fill="#343434"/>
      <path d="M15.925 2L8.5 17.46l7.425 4.86 7.425-4.86L15.925 2z" fill="#8C8C8C"/>
      <path d="M15.925 22.32L8.5 17.46l7.425 4.86 7.425-4.86-7.425 4.86z" fill="#3C3C3B"/>
      <path d="M15.925 12.58L8.5 17.46l7.425-10.68 7.425 10.68-7.425-4.88z" fill="#141414"/>
      <path d="M15.925 29.78l7.425-10.68-7.425 4.86V29.78z" fill="#393939"/>
      <path d="M8.5 19.1l7.425 4.86V12.58L8.5 19.1z" fill="#828282"/>
    </svg>
  );

  const SwapCard = () => (
    <div className={styles.swapCard}>
      <div className={styles.swapHeader}>
        <div className={styles.swapTitle}>
          SWAP TO <span>{toToken.symbol}</span>
        </div>
        <div className={styles.swapSubtitle}>
          1 {fromToken.symbol} = {rate} {toToken.symbol}
        </div>
      </div>

      {account && (
        <div className={styles.walletStatus}>
          <span className={isCorrectChain ? styles.walletDotOk : styles.walletDotWarn} />
          {shortAddress}
          {!isCorrectChain && " · jaringan salah"}
        </div>
      )}

      <div className={styles.tokenInputGroup}>
        <div className={styles.tokenLabel}>From</div>
        <div className={styles.tokenBox}>
          <div className={styles.tokenIcon}>
            <EthLogo />
          </div>
          <div className={styles.tokenInfo}>
            <div className={styles.tokenName}>{fromToken.symbol}</div>
            <div className={styles.tokenBalance}>
              Balance: {account ? (ethBalance ?? "...") : fromToken.balance}
            </div>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            className={styles.tokenAmountInput}
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.swapArrow}>
        <div className={styles.swapArrowIcon}>
          <ArrowDown size={18} />
        </div>
      </div>

      <div className={styles.tokenInputGroup}>
        <div className={styles.tokenLabel}>To</div>
        <div className={styles.tokenBox}>
          <div className={styles.tokenIconImage}>
            <Image
              src="/logo.png"
              alt="$SHERIFF"
              fill
              sizes="32px"
              className={styles.tokenIconImg}
            />
          </div>
          <div className={styles.tokenInfo}>
            <div className={styles.tokenName}>{toToken.symbol}</div>
            <div className={styles.tokenBalance}>
              {account ? `Balance: ${tokenBalance ?? "..."}` : toToken.name}
            </div>
          </div>
          <div className={styles.tokenAmount}>
            {amountIn ? (Number(amountIn) * Number(rate)).toLocaleString() : "0"}
          </div>
        </div>
      </div>

      <button
        className={styles.swapButton}
        onClick={account ? handleSwap : connectWallet}
        disabled={isConnecting || isSwapping}
      >
        {isConnecting || isSwapping ? (
          <span className={styles.swapButtonLoading}>
            <Loader2 size={16} className={styles.spinner} />
            {isConnecting ? "Menghubungkan..." : "Memproses swap..."}
          </span>
        ) : !account ? (
          "CONNECT WALLET"
        ) : !isCorrectChain ? (
          "SWITCH NETWORK"
        ) : (
          "SWAP NOW"
        )}
      </button>

      {walletError && <div className={styles.walletError}>{walletError}</div>}
      {txHash && (
        <a
          href={`${ROBINHOOD_CHAIN.blockExplorerUrls[0]}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.txLink}
        >
          Lihat transaksi ↗
        </a>
      )}

      <div className={styles.rateInfo}>
        Slippage: <span>{slippage}</span> • Network: <span>{TOKEN_INFO.network}</span>
      </div>
    </div>
  );

  return (
    <>
      <nav className={`${styles.navbar} ${isNavHidden ? styles.navbarHidden : ""}`}>
        <div className={styles.navbarInner}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoImageWrap}>
              <Image
                src="/logo.png"
                alt="Pepe Sheriff"
                fill
                className={styles.logoImage}
                priority
              />
            </div>
          </Link>

          <div className={styles.desktopMenu}>
            {NAV_LINKS.map((item, index) => (
              <Link key={index} href={item.href} className={styles.navItem}>
                {item.label}
              </Link>
            ))}

            <div className={styles.dropdownWrapper} ref={dropdownRef}>
              <button className={styles.dropdownToggle} onClick={toggleDropdown}>
                Buy Now
                <span className={`${styles.dropdownArrow} ${dropdownOpen ? styles.dropdownArrowOpen : ""}`}>
                  <ChevronDown size={16} />
                </span>
              </button>

              <div className={`${styles.dropdownMenu} ${dropdownOpen ? styles.dropdownMenuOpen : ""}`}>
                <SwapCard />
              </div>
            </div>
          </div>

          <button
            className={`${styles.hamburger} ${isOpen ? styles.hamburgerOpen : ""}`}
            onClick={toggleDrawer}
            aria-label="Toggle menu"
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>
        </div>
      </nav>

      <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`} onClick={closeDrawer} />

      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>
            SHERIFF<span>PEPE</span>
          </span>
          <button className={styles.closeButton} onClick={closeDrawer}>✕</button>
        </div>

        <div className={styles.drawerNav}>
          {NAV_LINKS.map((item, index) => (
            <Link key={index} href={item.href} className={styles.drawerItem} onClick={closeDrawer}>
              {item.label}
            </Link>
          ))}

          <button className={styles.drawerBuyButton} onClick={handleMobileBuyNow}>
            Buy Now
          </button>
        </div>
      </div>

      <div className={`${styles.modalOverlay} ${showSwapModal ? styles.modalOverlayOpen : ""}`}>
        <div className={styles.modalSwap}>
          <div className={styles.modalHeader}>
            <div className={styles.modalTitle}>
              SWAP TO <span>{toToken.symbol}</span>
            </div>
            <button className={styles.modalClose} onClick={closeSwapModal}>✕</button>
          </div>
          <SwapCard />
        </div>
      </div>
    </>
  );
}