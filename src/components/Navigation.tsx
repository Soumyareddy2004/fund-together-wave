import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ConnectButton } from "thirdweb/react";
import { Button } from "@/components/ui/button";
import { Heart, Plus, Home, User, Sun, Moon } from "lucide-react";
import { createWallet } from "thirdweb/wallets";
import { createThirdwebClient } from "thirdweb";
import { sepolia } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: "8f67f9ec1ed8372843b03898af81f38c"
});

const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
];

const Navigation = () => {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const isActive = (path: string) => location.pathname === path;

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <nav className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          {/* <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div> */}
          <span className="bg-gradient-hero bg-clip-text text-transparent">
            HopeChain
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/">
            <Button variant={isActive("/") ? "default" : "ghost"} className="gap-2">
              <Home className="w-4 h-4" /> Campaigns
            </Button>
          </Link>
          <Link to="/create">
            <Button variant={isActive("/create") ? "default" : "ghost"} className="gap-2">
              <Plus className="w-4 h-4" /> Create
            </Button>
          </Link>
          <Link to="/my-campaigns">
            <Button variant={isActive("/my-campaigns") ? "default" : "ghost"} className="gap-2">
              <User className="w-4 h-4" /> My Campaigns
            </Button>
          </Link>
        </div>

        {/* Wallet + Theme Toggle */}
        <div className="flex items-center gap-4">
          <ConnectButton
            client={client}
            wallets={wallets}
            chain={sepolia}
            connectButton={{ label: "Connect Wallet" }}
            connectModal={{ size: "compact" }}
          />
          <Button onClick={toggleTheme} variant="outline" className="p-2">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
