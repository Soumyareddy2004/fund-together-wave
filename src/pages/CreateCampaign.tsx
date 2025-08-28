import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { createThirdwebClient, getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { parseEther } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Heart, Upload, Calendar, Target } from "lucide-react";

const CONTRACT_ADDRESS = "0x2fe7cE39fb54297D8C485651e74174EFaFAA0ebE";
const client = createThirdwebClient({
  clientId: "8f67f9ec1ed8372843b03898af81f38c"
});

const CreateCampaign = () => {
  const navigate = useNavigate();
  const account = useActiveAccount();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target: "",
    deadline: "",
    image: ""
  });

  const contract = getContract({
    client,
    chain: sepolia,
    address: CONTRACT_ADDRESS,
  });

  const { mutate: sendTransaction } = useSendTransaction();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a campaign.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title || !formData.description || !formData.target || !formData.deadline) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Convert target to Wei
      const targetInWei = parseEther(formData.target);
      
      // Convert deadline to timestamp
      const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000);

      const transaction = prepareContractCall({
        contract,
        method: "function createCampaign(address _owner, string memory _title, string memory _description, uint256 _target, uint256 _deadline, string memory _image) public returns (uint256)",
        params: [
          account.address,
          formData.title,
          formData.description,
          BigInt(targetInWei),
          BigInt(deadlineTimestamp),
          formData.image || "https://via.placeholder.com/400x300?text=Campaign"
        ]
      });

      sendTransaction(transaction, {
        onSuccess: (result) => {
          toast({
            title: "Campaign created!",
            description: "Your campaign has been successfully created on the blockchain.",
          });
          navigate("/");
        },
        onError: (error) => {
          console.error("Transaction failed:", error);
          toast({
            title: "Transaction failed",
            description: "Failed to create campaign. Please try again.",
            variant: "destructive"
          });
        }
      });

    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign. Please check your inputs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
          Create a Campaign
        </h1>
        <p className="text-muted-foreground">
          Start your journey to make a difference. Create a campaign to raise funds for a meaningful cause.
        </p>
      </div>

      <Card className="bg-gradient-card border-0 shadow-elegant">
        <CardHeader>
          <CardTitle className="text-2xl">Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Help build a school in rural area"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Campaign Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your campaign, why it matters, and how the funds will be used..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Target Amount (ETH) *
                </Label>
                <Input
                  id="target"
                  name="target"
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.target}
                  onChange={handleInputChange}
                  placeholder="1.5"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Deadline *
                </Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  min={minDateString}
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Campaign Image URL (Optional)
              </Label>
              <Input
                id="image"
                name="image"
                type="url"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-sm text-muted-foreground">
                Provide a URL to an image that represents your campaign
              </p>
            </div>

            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !account}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                {loading ? "Creating..." : "Create Campaign"}
              </Button>
            </div>

            {!account && (
              <p className="text-sm text-center text-muted-foreground">
                Please connect your wallet to create a campaign
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCampaign;