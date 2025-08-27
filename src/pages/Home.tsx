import { useEffect, useState } from "react";
import { readContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { createThirdwebClient, getContract } from "thirdweb";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatEther } from "ethers";

// Contract configuration
const CONTRACT_ADDRESS = "0x2fe7cE39fb54297D8C485651e74174EFaFAA0ebE";
const client = createThirdwebClient({
  clientId: "your-client-id" // Replace with your thirdweb client ID
});

interface Campaign {
  id: number;
  owner: string;
  title: string;
  description: string;
  target: bigint;
  deadline: bigint;
  amountCollected: bigint;
  image: string;
}

const Home = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const contract = getContract({
    client,
    chain: sepolia,
    address: CONTRACT_ADDRESS,
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const result = await readContract({
        contract,
        method: "function getCampaigns() view returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image, address[] donators, uint256[] donations)[])",
        params: []
      });

      const formattedCampaigns = result.map((campaign: any, index: number) => ({
        id: index,
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: BigInt(campaign.target),
        deadline: BigInt(campaign.deadline),
        amountCollected: BigInt(campaign.amountCollected),
        image: campaign.image
      }));

      setCampaigns(formattedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDeadline = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days} days left`;
    } else {
      return "Expired";
    }
  };

  const calculateProgress = (collected: bigint, target: bigint) => {
    if (target === BigInt(0)) return 0;
    return Math.min((Number(collected) / Number(target)) * 100, 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded mb-4" />
                <div className="h-2 bg-muted rounded mb-4" />
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-20" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
          Help Build a Better Tomorrow
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join our decentralized crowdfunding platform to support meaningful causes and help those in need through blockchain technology.
        </p>
        <Link to="/create">
          <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
            Start a Campaign
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <Card 
            key={campaign.id} 
            className="overflow-hidden hover:shadow-elegant transition-all duration-300 bg-gradient-card border-0"
          >
            <div className="h-48 overflow-hidden">
              <img 
                src={campaign.image || "/api/placeholder/400/300"} 
                alt={campaign.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2 line-clamp-2">
                {campaign.title}
              </h3>
              <p className="text-muted-foreground mb-4 line-clamp-2">
                {campaign.description}
              </p>
              
              {/* Progress */}
              <div className="mb-4">
                <Progress 
                  value={calculateProgress(campaign.amountCollected, campaign.target)} 
                  className="mb-2"
                />
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-primary">
                    {formatEther(campaign.amountCollected)} ETH
                  </span>
                  <span className="text-muted-foreground">
                    of {formatEther(campaign.target)} ETH
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDeadline(campaign.deadline)}
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {((Number(campaign.amountCollected) / Number(campaign.target)) * 100).toFixed(1)}%
                </div>
              </div>

              <Link to={`/campaign/${campaign.id}`}>
                <Button className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
          <p className="text-muted-foreground mb-6">Be the first to create a campaign and help others in need.</p>
          <Link to="/create">
            <Button className="bg-gradient-primary">Create First Campaign</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;