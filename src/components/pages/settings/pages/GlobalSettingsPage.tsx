import Container from '@/components/container';
import SettingsForm from '@/components/forms/settings-form'
import Header from '@/components/header'

const SettingsPage = () => {
    return (
        <Container>
            <Header
                title="Global Settings"
                description="Configure platform-wide default settings"
            />
            <SettingsForm />
        </Container>
    )
}

export default SettingsPage