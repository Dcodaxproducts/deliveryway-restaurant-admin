import UserProfile from "@/components/profile/UserProfile";
import Container from "@/components/container";
import Header from "@/components/profile/header"

const ProfilePage = () => {
    return (
        <Container>
            <Header
                title="Profile Management"
                description="View and manage your profile"
            />
<UserProfile />
          
        </Container>
    )
}

export default ProfilePage