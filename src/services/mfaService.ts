import { ApiService } from './api'

export interface MfaSetupResponse {
  qrCode: string
  secret: string
  backupCodes: string[]
}

export interface MfaStatusResponse {
  mfaEnabled: boolean
  mfaSetupCompleted: boolean
  backupCodesCount: number
}

class MFAService extends ApiService {
  constructor() {
    super('/mfa')
  }

  async setupMfa(): Promise<MfaSetupResponse> {
    const response = await this.post<any>('/setup')
    return {
      qrCode: response.data.qrCodeUrl,
      secret: response.data.secret,
      backupCodes: response.data.backupCodes
    }
  }

  async verifyMfaSetup(code: string): Promise<void> {
    return this.post<void>('/verify-setup', { token: code })
  }

  async verifyMfa(token: string): Promise<void> {
    return this.post<void>('/verify', { token })
  }

  async disableMfa(token: string): Promise<void> {
    return this.post<void>('/disable', { token })
  }

  async regenerateBackupCodes(token: string): Promise<string[]> {
    const response = await this.post<any>('/regenerate-backup-codes', { token })
    return response.data.backupCodes || []
  }

  async getMfaStatus(): Promise<MfaStatusResponse> {
    return this.get<MfaStatusResponse>('/status')
  }
}

export const mfaService = new MFAService()