import Container from "@/components/common/Container";
import NotificationForm from "@/components/pages/Notifications/forms/NotificationSettingsForm"
import Header from "@/components/common/PageHeader"

const NotificationSettingsPage = () => {
    return (
        <Container>
           <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      
            <Header
                title="Notification Settings"
                description="Automatically print orders and connect your POS system."
            />
</div>
            <div className="flex flex-col gap-[32px] w-full bg-white p-[30px] rounded-[14px]">
                <NotificationForm />
            </div>
        </Container>
    )
}

export default NotificationSettingsPage
