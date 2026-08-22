import { LUISpacer, LUITab, LUITabs } from '@/components'
import ConfigurationPage from '../configuration/components/ConfigurationPage'
import DocumentNumberingPage from '../document-numbering/components/DocumentNumberingPage'

const SettingsPage = () => {
  return (
    <LUITabs>
      <LUITab label="Configuration">
        <LUISpacer h={6} />
        <ConfigurationPage />
      </LUITab>

      <LUITab label="Document Numbering">
        <LUISpacer h={6} />
        <DocumentNumberingPage />
      </LUITab>
    </LUITabs>
  )
}

export default SettingsPage
