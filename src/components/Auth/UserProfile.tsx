//  ../../../components/Auth/UserProfile.tsx
// Code for the UserProfile component
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export const UserProfile = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata.full_name || "User"}
              />
              <AvatarFallback>
                {user.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {user.user_metadata.full_name || "User Profile"}
          </CardTitle>
          <CardDescription className="text-center">
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Email</div>
            <div className="text-base">{user.email}</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Provider</div>
            <div className="text-base capitalize">
              {user.app_metadata.provider || "Email"}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">
              Last Sign In
            </div>
            <div className="text-base">
              {new Date(user.last_sign_in_at || "").toLocaleString()}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
