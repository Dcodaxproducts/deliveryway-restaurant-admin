import Container from "@/components/container";
import NotificationForm from "@/components/forms/notification-form"
import Header from "@/components/header"
import { Button } from "@/components/ui/button";

const NotificationSettingsPage = () => {
    return (
        <Container>
           <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      
            <Header
                title="Notification Settings"
                description="Automatically print orders and connect your POS system."
            />
             {/* <Button variant="default"  className="h-[38px] sm:h-[44px] rounded-[12px] px-4 sm:px-15 flex items-center gap-2 bg-primary hover:bg-red-700 text-white text-[13px] sm:text-[15px] font-[500]"
      >
                Save
             </Button> */}
</div>
            <div className="flex flex-col gap-[32px] w-full bg-white p-[30px] rounded-[14px]">
                <NotificationForm />
            </div>
        </Container>
    )
}

export default NotificationSettingsPage