import Container from '@/components/common/Container';
import SettingsForm from '@/components/pages/Settings/forms/SettingsForm'
import Header from '@/components/common/PageHeader'

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