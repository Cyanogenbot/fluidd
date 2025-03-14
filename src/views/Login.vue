<template>
  <v-row
    :dense="$vuetify.breakpoint.smAndDown"
    justify="center"
    align="center"
  >
    <v-col
      cols="12"
      md="4"
      lg="3"
      xl="2"
    >
      <v-form
        ref="form"
        v-model="valid"
        @submit.prevent="handleLogin"
      >
        <div class="text-center">
          <p>Welcome back.<br>Sign in below to stay in touch with your printer.</p>

          <v-alert
            v-if="error"
            type="error"
          >
            Invalid credentials
          </v-alert>

          <v-text-field
            v-model="username"
            label="Username"
            autocomplete="username"
            filled
            dense
            hide-details="auto"
            :disabled="loading"
            class="mb-4"
          />

          <v-text-field
            v-model="password"
            label="Password"
            autocomplete="current-password"
            filled
            dense
            type="password"
            hide-details="auto"
            :disabled="loading"
            class="mb-4"
          />

          <app-btn
            type="submit"
            :disabled="loading"
            large
            block
            class="mb-6"
          >
            <v-icon
              v-if="loading"
              class="spin mr-2"
            >
              $loading
            </v-icon>
            Login
          </app-btn>

          <app-btn
            color=""
            plain
            class="custom-transform-class text-none"
            :href="$globals.DOCS_AUTH_LOST_PASSWORD"
            target="_blank"
          >
            Forgotten your password?
          </app-btn>

          <app-btn
            color=""
            plain
            class="custom-transform-class text-none"
            :href="$globals.DOCS_AUTH"
            target="_blank"
          >
            Unsure why you're seeing this?
          </app-btn>
        </div>
      </v-form>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { appInit } from '@/init'
import consola from 'consola'
import { InitConfig } from '@/store/config/types'

@Component({})
export default class Login extends Vue {
  username = ''
  password = ''
  valid = true
  error = false
  loading = false

  async handleLogin () {
    this.error = false
    this.loading = true
    try {
      await this.$store.dispatch('auth/login', { username: this.username, password: this.password })
    } catch (err) {
      this.error = true
    }
    this.loading = false

    // Re-init the app.
    if (!this.error) {
      const instance = this.$store.getters['config/getCurrentInstance']
      appInit(instance, this.$store.state.config.hostConfig)
        .then((config: InitConfig) => {
          // Reconnect the socket with the new instance url.
          if (config.apiConnected && config.apiAuthenticated) {
            consola.debug('Activating socket with config', config)
            this.$socket.connect(config.apiConfig.socketUrl)
          }
        })
    }
  }
}
</script>

<style lang="scss" scoped>
  .v-card__actions {
    padding: 8px 16px;
  }
</style>
