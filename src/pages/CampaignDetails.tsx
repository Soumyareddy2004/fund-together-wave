import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { readContract, prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { createThirdwebClient, getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { formatEther, parseEther } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Calendar, 
  Target, 
  Users, 
  Heart, 
  Clock,
  User,
  DollarSign
} from "lucide-react";

const CONTRACT_ADDRESS = "0x2fe7cE39fb54297D8C485651e74174EFaFAA0ebE";
const client = createThirdwebClient({
  clientId: "8f67f9ec1ed8372843b03898af81f38c" // Replace with your thirdweb client ID
});

interface Campaign {
  owner: string;
  title: string;
  description: string;
  target: bigint;
  deadline: bigint;
  amountCollected: bigint;
  image: string;
  donators: string[];
  donations: bigint[];
}

interface Donator {
  address: string;
  amount: bigint;
}

const CampaignDetails = () => {
  const { id } = useParams<{ id: string }>();
  const account = useActiveAccount();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donators, setDonators] = useState<Donator[]>([]);
  const [donationAmount, setDonationAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);

  const contract = getContract({
    client,
    chain: sepolia,
    address: CONTRACT_ADDRESS,
  });

  const { mutate: sendTransaction } = useSendTransaction();

  useEffect(() => {
    if (id !== undefined) {
      fetchCampaignDetails();
      fetchDonators();
    }
  }, [id]);

 const fetchCampaignDetails = async () => {
  try {
    const result = await readContract({
      contract,
      method: "function getCampaigns() view returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image, address[] donators, uint256[] donations)[])",
      params: []
    });

    const campaignData = result[Number(id)];

    if (!campaignData) {
      setCampaign(null);
      return;
    }

    setCampaign({
      owner: campaignData.owner,
      title: campaignData.title,
      description: campaignData.description,
      target: BigInt(campaignData.target),
      deadline: BigInt(campaignData.deadline),
      amountCollected: BigInt(campaignData.amountCollected),
      image: campaignData.image,
      donators: [...campaignData.donators],
      donations: campaignData.donations.map((d: any) => BigInt(d))
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    toast({
      title: "Error",
      description: "Failed to load campaign details.",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};


  const fetchDonators = async () => {
    try {
      const result = await readContract({
        contract,
        method: "function getDonators(uint256 _id) view returns (address[] memory, uint256[] memory)",
        params: [BigInt(id!)]
      });

      const donatorsData = result[0].map((address: string, index: number) => ({
        address,
        amount: BigInt(result[1][index])
      }));

      setDonators(donatorsData);
    } catch (error) {
      console.error("Error fetching donators:", error);
    }
  };

  const handleDonate = async () => {
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to donate.",
        variant: "destructive"
      });
      return;
    }

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive"
      });
      return;
    }

    setDonating(true);

    try {
      const amountInWei = parseEther(donationAmount);

      const transaction = prepareContractCall({
        contract,
        method: "function donateToCampaign(uint256 _id) public payable",
        params: [BigInt(id!)],
        value: BigInt(amountInWei)
      });

      sendTransaction(transaction, {
        onSuccess: (result) => {
          toast({
            title: "Donation successful!",
            description: `Thank you for donating ${donationAmount} ETH to this campaign.`,
          });
          setDonationAmount("");
          // Refresh data
          fetchCampaignDetails();
          fetchDonators();
        },
        onError: (error) => {
          console.error("Transaction failed:", error);
          toast({
            title: "Donation failed",
            description: "Failed to process your donation. Please try again.",
            variant: "destructive"
          });
        }
      });

    } catch (error) {
      console.error("Error donating:", error);
      toast({
        title: "Error",
        description: "Failed to process donation.",
        variant: "destructive"
      });
    } finally {
      setDonating(false);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-8 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="h-64 bg-muted rounded-lg mb-4" />
              <div className="h-6 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded mb-4" />
              <div className="h-2 bg-muted rounded mb-4" />
            </div>
            <div>
              <div className="h-32 bg-muted rounded mb-4" />
              <div className="h-48 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
        <Link to="/">
          <Button>Back to Campaigns</Button>
        </Link>
      </div>
    );
  }

  const deadline = formatDeadline(campaign.deadline);
  const progress = calculateProgress(campaign.amountCollected, campaign.target);

  return (
    <div className="container mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaign Info */}
        <div>
          <div className="relative overflow-hidden rounded-lg mb-6">
            <img 
              src={campaign.image || "/api/placeholder/600/400"} 
              alt={campaign.title}
              className="w-full h-64 object-cover"
            />
            {deadline.expired && (
              <Badge variant="destructive" className="absolute top-4 right-4">
                Expired
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">{campaign.title}</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {campaign.description}
          </p>

          {/* Campaign Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">
                {campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className={deadline.expired ? "text-destructive" : ""}>
                {deadline.text}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="mb-2" />
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-primary">
                {formatEther(campaign.amountCollected)} ETH raised
              </span>
              <span className="text-muted-foreground">
                of {formatEther(campaign.target)} ETH goal
              </span>
            </div>
          </div>
        </div>

        {/* Donation Section */}
        <div className="space-y-6">
          {/* Donation Form */}
          {!deadline.expired && (
            <Card className="bg-gradient-card border-0 shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Make a Donation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="Enter amount in ETH"
                  />
                </div>
                <Button 
                  onClick={handleDonate}
                  disabled={donating || !account || !donationAmount}
                  className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  {donating ? "Processing..." : "Donate Now"}
                </Button>
                {!account && (
                  <p className="text-sm text-center text-muted-foreground">
                    Please connect your wallet to donate
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Donators List */}
          <Card className="bg-gradient-card border-0 shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Supporters ({donators.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {donators.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {donators.map((donator, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">
                          {donator.address.slice(0, 6)}...{donator.address.slice(-4)}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {formatEther(donator.amount)} ETH
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No donations yet. Be the first to support this cause!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;