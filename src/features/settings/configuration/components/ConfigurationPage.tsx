import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import {
  LUIButton,
  LUICard,
  LUIFlex,
  LUISegmentedControl,
  LUITextInput,
  LUIToggle,
  useLUINotification,
} from '@/components'
import { useConfigurations, useUpdateConfigurations } from '../configuration.query'
import './configuration.css'

/* Configs whose value isn't free text; everything else falls back to a text input. */
const CONFIG_CONTROLS: Record<string, { type: 'segmented'; options: string[] } | { type: 'toggle' }> = {
  calendar_type: { type: 'segmented', options: ['AD', 'BS'] },
  default_rounding: { type: 'toggle' },
}

const getErrorMessage = (error: unknown) =>
  isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ?? error.message)
    : 'Something went wrong'

const ConfigurationPage = () => {
  const notify = useLUINotification()
  const { data: configurations } = useConfigurations()
  const updateConfigurations = useUpdateConfigurations()

  const [values, setValues] = useState<Record<number, string>>({})

  /* Seed once — a background refetch must not clobber in-progress edits. */
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || !configurations) return
    seeded.current = true
    setValues(Object.fromEntries(configurations.map((config) => [config.id, config.value])))
  }, [configurations])

  const changed = (configurations ?? []).filter(
    (config) => config.is_editable && values[config.id] !== undefined && values[config.id] !== config.value,
  )
  const saving = updateConfigurations.isPending

  const onSave = async () => {
    try {
      await updateConfigurations.mutateAsync(
        changed.map((config) => ({ ...config, value: values[config.id] })),
      )
      notify.success('Configuration Saved', 'Your changes have been applied.')
    } catch (error) {
      notify.error('Save Failed', getErrorMessage(error))
    }
  }

  return (
    <LUICard>
      <LUIFlex justify="space-between" align="center">
        <div>
          <h2 className="page-title">Configuration</h2>
          <p className="sub-title">Global settings applied across the system.</p>
        </div>

        <LUIButton onClick={onSave} disabled={changed.length === 0 || saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </LUIButton>
      </LUIFlex>

      <div className="config-list">
        {(configurations ?? []).map((config) => (
          <div key={config.id} className="config-row">
            <div className="config-row-info">
              <span className="config-row-label">{config.label}</span>
              <span className="config-row-name">{config.name}</span>
            </div>

            {(() => {
              const control = CONFIG_CONTROLS[config.name]
              const value = values[config.id] ?? config.value
              const setValue = (next: string) =>
                setValues((prev) => ({ ...prev, [config.id]: next }))

              if (control?.type === 'segmented') {
                return (
                  <LUIFlex align="center">
                    <LUISegmentedControl
                      options={control.options}
                      disabled={!config.is_editable}
                      value={value}
                      onChange={(next) => setValue(next as string)}
                    />
                  </LUIFlex>
                )
              }

              if (control?.type === 'toggle') {
                return (
                  <LUIFlex align="center">
                    <LUIToggle
                      aria-label={config.label}
                      disabled={!config.is_editable}
                      checked={value === '1'}
                      onChange={(event) => setValue(event.target.checked ? '1' : '0')}
                    />
                  </LUIFlex>
                )
              }

              return (
                <LUITextInput
                  aria-label={config.label}
                  disabled={!config.is_editable}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
              )
            })()}
          </div>
        ))}
      </div>
    </LUICard>
  )
}

export default ConfigurationPage
