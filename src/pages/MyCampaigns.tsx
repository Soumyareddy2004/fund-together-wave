import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { readContract } from "thirdweb";
import { createThirdwebClient, getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Plus, User } from "lucide-react";
import { Link } from "react-router-dom";
import { formatEther } from "ethers";

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

const MyCampaigns = () => {
  const account = useActiveAccount();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const contract = getContract({
    client,
    chain: sepolia,
    address: CONTRACT_ADDRESS,
  });

  useEffect(() => {
    if (account) {
      fetchMyCampaigns();
    } else {
      setLoading(false);
    }
  }, [account]);

  const fetchMyCampaigns = async () => {
    try {
      const result = await readContract({
        contract,
        method: "function getCampaigns() view returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image, address[] donators, uint256[] donations)[])",
        params: []
      });

      // Filter campaigns owned by the connected account
      const myCampaigns = result
        .map((campaign: any, index: number) => ({
          id: index,
          owner: campaign.owner,
          title: campaign.title,
          description: campaign.description,
          target: BigInt(campaign.target),
          deadline: BigInt(campaign.deadline),
          amountCollected: BigInt(campaign.amountCollected),
          image: campaign.image
        }))
        .filter((campaign: Campaign) => 
          campaign.owner.toLowerCase() === account?.address.toLowerCase()
        );

      setCampaigns(myCampaigns);
    } catch (error) {
      console.error("Error fetching my campaigns:", error);
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
      return { text: `${days} days left`, expired: false };
    } else {
      return { text: "Expired", expired: true };
    }
  };

  const calculateProgress = (collected: bigint, target: bigint) => {
    if (target === BigInt(0)) return 0;
    return Math.min((Number(collected) / Number(target)) * 100, 100);
  };

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Please connect your wallet to view and manage your campaigns.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="h-8 bg-muted rounded w-48 mb-2" />
          <div className="h-4 bg-muted rounded w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
            My Campaigns
          </h1>
          <p className="text-muted-foreground">
            Manage and track your fundraising campaigns
          </p>
        </div>
        <Link to="/create">
          <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => {
          const deadline = formatDeadline(campaign.deadline);
          const progress = calculateProgress(campaign.amountCollected, campaign.target);

          return (
            <Card 
              key={campaign.id} 
              className="overflow-hidden hover:shadow-elegant transition-all duration-300 bg-gradient-card border-0"
            >
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={campaign.image || "/api/placeholder/400/300"} 
                  alt={campaign.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {deadline.expired && (
                  <Badge variant="destructive" className="absolute top-4 right-4">
                    Expired
                  </Badge>
                )}
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
                    value={progress} 
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
                <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span className={deadline.expired ? "text-destructive" : ""}>
                      {deadline.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {progress.toFixed(1)}%
                  </div>
                </div>

                <Link to={`/campaign/${campaign.id}`}>
                  <Button className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300">
                    View Campaign
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {campaigns.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start your journey by creating your first campaign to help make a difference in the world.
          </p>
          <Link to="/create">
            <Button className="bg-gradient-primary">Create Your First Campaign</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyCampaigns;