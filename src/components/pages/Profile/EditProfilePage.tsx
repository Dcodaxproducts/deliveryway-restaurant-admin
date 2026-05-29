import Container from "@/components/common/Container";
import EditProfileForm from "@/components/pages/Profile/components/EditProfileForm";
import ProfileHeader from "@/components/pages/Profile/components/ProfileHeader";

export default function EditProfilePage() {
  return (
    <Container>
      <ProfileHeader
        title="Profile Management"
        description="View and manage your profile"
      />
      <EditProfileForm />
    </Container>
  );
}
