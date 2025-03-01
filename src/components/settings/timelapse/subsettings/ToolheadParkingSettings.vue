<template>
  <div>
    <v-divider />
    <app-setting
      :title="$t('app.timelapse.setting.parkhead')"
      :sub-title="subtitleIfBlocked(parkheadBlocked)"
    >
      <v-switch
        v-model="parkhead"
        hide-details
        class="mb-5"
        :disabled="parkheadBlocked"
        @click.native.stop
      />
    </app-setting>

    <div v-if="parkhead">
      <v-divider />
      <app-setting
        :title="$t('app.timelapse.setting.park_time')"
        :sub-title="subtitleIfBlocked(parkTimeBlocked)"
      >
        <v-text-field
          ref="parkTimeElement"
          :value="parkTime"
          :rules="[rules.numRequired, rules.validNum, rules.numMin(0)]"
          :disabled="parkTimeBlocked"
          :hide-details="parkTimeElement ? parkTimeElement.valid : true"
          filled
          dense
          single-line
          suffix="ms"
          @change="setParkTime"
        />
      </app-setting>

      <v-divider />
      <app-setting
        :title="$t('app.timelapse.setting.park_travel_speed')"
        :sub-title="subtitleIfBlocked(parkTravelSpeedBlocked)"
      >
        <v-text-field
          ref="parkTravelSpeedElement"
          :value="parkTravelSpeed"
          :rules="[rules.numRequired, rules.validNum, rules.numMin(0)]"
          :disabled="parkTravelSpeedBlocked"
          :hide-details="parkTravelSpeedElement ? parkTravelSpeedElement.valid : true"
          filled
          dense
          single-line
          suffix="mm/s"
          @change="setParkTravelSpeed"
        />
      </app-setting>

      <v-divider />
      <app-setting
        :title="$t('app.timelapse.setting.parkpos.label')"
        :sub-title="subtitleIfBlocked(parkposBlocked)"
      >
        <v-select
          v-model="parkpos"
          filled
          dense
          hide-details="auto"
          :items="parkPositions"
          :disabled="parkposBlocked"
          item-value="value"
          item-text="text"
        />
      </app-setting>

      <custom-park-position-settings v-if="parkpos === 'custom'" />

      <v-divider />
      <app-setting
        :title="$t('app.timelapse.setting.park_custom_pos_dz')"
        :sub-title="subtitleIfBlocked(parkPosZBlocked)"
      >
        <v-text-field
          ref="parkPosDZElement"
          :value="parkPosZ"
          :rules="[rules.numRequired, rules.validNum, rules.numMin(0)]"
          :disabled="parkPosZBlocked"
          :hide-details="parkPosDZElement ? parkPosDZElement.valid : true"
          filled
          dense
          single-line
          suffix="mm"
          @change="setParkPosZ"
        />
      </app-setting>

      <v-divider />
      <app-setting
        :title="$t('app.timelapse.setting.fw_retract')"
        :sub-title="subtitleIfBlocked(firmwareRetractBlocked)"
      >
        <v-switch
          v-model="firmwareRetract"
          hide-details
          class="mb-5"
          :disabled="firmwareRetractBlocked"
          @click.native.stop
        />
      </app-setting>

      <park-extrude-retract-settings v-if="!firmwareRetract" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AppSetting from '@/components/ui/AppSetting.vue'
import { ParkPosition, TimelapseSettings } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'
import ParkExtrudeRetractSettings from '@/components/settings/timelapse/subsettings/ParkExtrudeRetractSettings.vue'
import CustomParkPositionSettings from '@/components/settings/timelapse/subsettings/CustomParkPositionSettings.vue'

@Component({
  components: {
    CustomParkPositionSettings,
    ParkExtrudeRetractSettings,
    AppSetting
  }
})
export default class LayerMacroSettings extends Mixins(StateMixin) {
  @Ref('parkTimeElement') parkTimeElement?: any;
  @Ref('parkTravelSpeedElement') parkTravelSpeedElement?: any;
  @Ref('parkPosDZElement') parkPosDZElement?: any;

  rules = {
    numRequired: (v: number | string) => v !== '' || this.$t('app.general.simple_form.error.required'),
    validNum: (v: string) => !isNaN(+v) || this.$t('app.general.simple_form.error.invalid_number'),
    numMin: (min: number) => (v: number) => v >= min || this.$t('app.general.simple_form.error.min', { min }),
    numMax: (max: number) => (v: number) => v <= max || this.$t('app.general.simple_form.error.min', { max })
  }

  get parkPositions (): {text: string, value: ParkPosition}[] {
    const values: ParkPosition[] = ['front_left', 'front_right', 'center', 'back_left', 'back_right', 'custom']

    return values.map(value => ({ text: this.$tc(`app.timelapse.setting.parkpos.${value}`), value }))
  }

  get parkheadBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('parkhead')
  }

  get parkhead (): boolean {
    return this.settings?.parkhead
  }

  set parkhead (value: boolean) {
    SocketActions.machineTimelapseSetSettings({ parkhead: value })
  }

  get parkposBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('parkpos')
  }

  get parkpos (): ParkPosition {
    return this.settings?.parkpos
  }

  set parkpos (value: ParkPosition) {
    SocketActions.machineTimelapseSetSettings({ parkpos: value })
  }

  get parkTimeBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('park_time')
  }

  get parkTime (): number {
    return this.settings?.park_time * 1000
  }

  setParkTime (value: number) {
    if (this.parkTimeElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ park_time: value / 1000 })
    }
  }

  get parkTravelSpeedBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('park_travel_speed')
  }

  get parkTravelSpeed (): number {
    return this.settings?.park_travel_speed
  }

  setParkTravelSpeed (value: number) {
    if (this.parkTravelSpeedElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ park_travel_speed: value })
    }
  }

  get parkPosZBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('park_custom_pos_dz')
  }

  get parkPosZ (): number {
    return this.settings?.park_custom_pos_dz
  }

  setParkPosZ (value: number) {
    if (this.parkPosDZElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ park_custom_pos_dz: value })
    }
  }

  get firmwareRetractBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('fw_retract')
  }

  get firmwareRetract (): boolean {
    return this.settings?.fw_retract
  }

  set firmwareRetract (value: boolean) {
    SocketActions.machineTimelapseSetSettings({ fw_retract: value })
  }

  get settings (): TimelapseSettings {
    return this.$store.getters['timelapse/getSettings']
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.timelapse.tooltip.managed_by_moonraker') : ''
  }
}
</script>
