import Container from "@/components/container";
import EditProfile from "@/components/profile/EditProfile";
import Header from "@/components/profile/header"

const ProfilePage = () => {
    return (
        <Container>
            <Header
                title="Profile Management"
                description="View and manage your profile"
            />
          <EditProfile />
        </Container>
    )
}

export default ProfilePage