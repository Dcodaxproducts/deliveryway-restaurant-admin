import Container from "@/components/common/Container";
import ProfileHeader from "@/components/pages/Profile/components/ProfileHeader";
import UserProfile from "@/components/pages/Profile/components/UserProfile";

export default function ProfilePage() {
  return (
    <Container>
      <ProfileHeader
        title="Profile Management"
        description="View and manage your profile"
      />
      <UserProfile />
    </Container>
  );
}
