import { createHmac, timingSafeEqual } from 'crypto'

export function verifyGithubWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature) {
    return false
  }

  const sigHashAlg = 'sha256'
  const hmac = createHmac(sigHashAlg, secret)
  const digest = Buffer.from(
    sigHashAlg + '=' + hmac.update(payload).digest('hex'),
    'utf8'
  )
  const checksum = Buffer.from(signature, 'utf8')

  if (digest.length !== checksum.length) {
    return false
  }

  return timingSafeEqual(digest, checksum)
}

export async function createOrganizationWebhook(orgName: string, accessToken: string) {
  const webhookSecret = generateWebhookSecret()
  
  // Get the base URL from environment variable or use a default
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pushtomemory.com'
  const webhookUrl = `${baseUrl}/api/webhook`
  
  console.log('Creating webhook with config:', {
    url: webhookUrl,
    organization: orgName,
    events: ['push']
  })

  try {
    const response = await fetch(`https://api.github.com/orgs/${orgName}/hooks`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: webhookSecret,
          insecure_ssl: '0'
        }
      })
    })

    const responseData = await response.json()
    
    if (!response.ok) {
      console.error('GitHub webhook creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData
      })
      throw new Error(`Failed to create webhook: ${responseData.message || 'Unknown error'}`)
    }

    console.log('Webhook created successfully:', responseData)

    return {
      id: responseData.id,
      secret: webhookSecret
    }
  } catch (error) {
    console.error('Error in createOrganizationWebhook:', error)
    throw error
  }
}

export async function listUserOrganizations(accessToken: string) {
  const response = await fetch('https://api.github.com/user/orgs', {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${accessToken}`,
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to list organizations: ${error.message}`)
  }

  return response.json()
}

export async function deleteGithubWebhook(orgName: string, webhookId: number, accessToken: string) {
  const response = await fetch(
    `https://api.github.com/orgs/${orgName}/hooks/${webhookId}`,
    {
      method: 'DELETE',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  )

  if (!response.ok && response.status !== 404) { // 404 means already deleted
    const error = await response.json()
    throw new Error(`Failed to delete webhook: ${error.message}`)
  }
}

export async function createRepositoryWebhook(owner: string, repo: string, accessToken: string) {
  const webhookSecret = generateWebhookSecret()
  
  // Get the base URL from environment variable or use a default
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pushtomemory.com'
  const webhookUrl = `${baseUrl}/api/webhook`
  
  console.log('Creating repository webhook with config:', {
    url: webhookUrl,
    repository: `${owner}/${repo}`,
    events: ['push']
  })

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: webhookSecret,
          insecure_ssl: '0'
        }
      })
    })

    const responseData = await response.json()
    
    if (!response.ok) {
      console.error('GitHub webhook creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData
      })
      throw new Error(`Failed to create webhook: ${responseData.message || 'Unknown error'}`)
    }

    console.log('Repository webhook created successfully:', responseData)

    return {
      id: responseData.id,
      secret: webhookSecret
    }
  } catch (error) {
    console.error('Error in createRepositoryWebhook:', error)
    throw error
  }
}

export async function deleteRepositoryWebhook(owner: string, repo: string, webhookId: number, accessToken: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks/${webhookId}`,
    {
      method: 'DELETE',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  )

  if (!response.ok && response.status !== 404) { // 404 means already deleted
    const error = await response.json()
    throw new Error(`Failed to delete webhook: ${error.message}`)
  }
}

function generateWebhookSecret() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
} 