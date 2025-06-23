/**
 * API Migration Utilities
 * Helper functions to assist with API response format migration
 */

import { getApiEnvironment } from '@/config/api-mappings'

/**
 * Log API response structure for debugging
 * Helpful during migration to understand the actual API response format
 */
export function logApiResponseStructure(response: any, endpoint: string) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 API Response Structure - ${endpoint}`)
    console.log('Environment:', getApiEnvironment())
    console.log('Response Keys:', Object.keys(response))
    
    if (Array.isArray(response) && response.length > 0) {
      console.log('First Item Keys:', Object.keys(response[0]))
      
      // Log nested structure for opportunities
      if (response[0].token || response[0].asset) {
        const tokenData = response[0].token || response[0].asset
        console.log('Token Keys:', Object.keys(tokenData || {}))
      }
      
      if (response[0].platform || response[0].protocol) {
        const platformData = response[0].platform || response[0].protocol
        console.log('Platform Keys:', Object.keys(platformData || {}))
        
        if (platformData?.apy || platformData?.interestRates) {
          const apyData = platformData.apy || platformData.interestRates
          console.log('APY Keys:', Object.keys(apyData || {}))
        }
      }
      
      if (response[0].trend || response[0].trending) {
        const trendData = response[0].trend || response[0].trending
        console.log('Trend Keys:', Object.keys(trendData || {}))
      }
    }
    console.groupEnd()
  }
}

/**
 * Validate mapped response against expected structure
 * Helps ensure the mapping is working correctly
 */
export function validateMappedResponse(mappedData: any[], endpoint: string): boolean {
  if (!Array.isArray(mappedData) || mappedData.length === 0) {
    console.warn(`⚠️ ${endpoint}: Mapped data is empty or not an array`)
    return false
  }

  const firstItem = mappedData[0]
  const requiredFields = {
    token: ['address', 'symbol', 'name', 'logo', 'decimals', 'price_usd'],
    platform: ['name', 'platform_name', 'protocol_identifier', 'logo'],
    'platform.apy': ['current', 'avg_7days', 'avg_30days'],
    trend: ['value', 'type']
  }

  let isValid = true

  Object.entries(requiredFields).forEach(([fieldPath, subFields]) => {
    const fieldData = fieldPath.includes('.') 
      ? fieldPath.split('.').reduce((obj, key) => obj?.[key], firstItem)
      : firstItem[fieldPath]

    if (!fieldData) {
      console.warn(`⚠️ ${endpoint}: Missing field '${fieldPath}'`)
      isValid = false
      return
    }

    subFields.forEach(subField => {
      if (fieldData[subField] === undefined) {
        console.warn(`⚠️ ${endpoint}: Missing subfield '${fieldPath}.${subField}'`)
        isValid = false
      }
    })
  })

  if (isValid) {
    console.log(`✅ ${endpoint}: Response mapping validation passed`)
  }

  return isValid
}

/**
 * Compare API responses between environments
 * Useful for identifying differences during migration
 */
export function compareApiResponses(
  prodResponse: any[], 
  devResponse: any[], 
  endpoint: string
) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔄 API Response Comparison - ${endpoint}`)
    
    // Compare top-level keys
    const prodKeys = Object.keys(prodResponse[0] || {})
    const devKeys = Object.keys(devResponse[0] || {})
    
    const onlyInProd = prodKeys.filter(key => !devKeys.includes(key))
    const onlyInDev = devKeys.filter(key => !prodKeys.includes(key))
    
    if (onlyInProd.length > 0) {
      console.log('🔴 Keys only in production:', onlyInProd)
    }
    
    if (onlyInDev.length > 0) {
      console.log('🟢 Keys only in development:', onlyInDev)
    }
    
    console.log('📊 Production keys:', prodKeys)
    console.log('📊 Development keys:', devKeys)
    
    console.groupEnd()
  }
}

/**
 * Create mapping suggestions based on response comparison
 * Analyzes two API responses and suggests possible key mappings
 */
export function suggestKeyMappings(
  oldResponse: any[], 
  newResponse: any[], 
  objectPath: string = ''
): Record<string, string> {
  if (!oldResponse.length || !newResponse.length) return {}

  const oldItem = oldResponse[0]
  const newItem = newResponse[0]
  const suggestions: Record<string, string> = {}

  // Simple heuristic: match keys with similar names
  Object.keys(oldItem).forEach(oldKey => {
    const newKeys = Object.keys(newItem)
    
    // Exact match
    if (newKeys.includes(oldKey)) {
      suggestions[oldKey] = oldKey
      return
    }

    // Case variations
    const lowerOldKey = oldKey.toLowerCase()
    const matchingKey = newKeys.find(newKey => 
      newKey.toLowerCase() === lowerOldKey ||
      newKey.toLowerCase().replace(/[_-]/g, '') === lowerOldKey.replace(/[_-]/g, '') ||
      lowerOldKey.includes(newKey.toLowerCase()) ||
      newKey.toLowerCase().includes(lowerOldKey)
    )

    if (matchingKey) {
      suggestions[oldKey] = matchingKey
    }
  })

  if (Object.keys(suggestions).length > 0) {
    console.group(`💡 Mapping Suggestions${objectPath ? ` for ${objectPath}` : ''}`)
    Object.entries(suggestions).forEach(([oldKey, newKey]) => {
      console.log(`  ${oldKey} → ${newKey}`)
    })
    console.groupEnd()
  }

  return suggestions
}

/**
 * Migration status checker
 * Reports on the current migration status and any issues
 */
export function checkMigrationStatus() {
  const environment = getApiEnvironment()
  
  console.group('🚀 API Migration Status')
  console.log('Current Environment:', environment)
  console.log('Base URL:', process.env.NEXT_PUBLIC_HOST)
  
  if (environment === 'production') {
    console.log('📍 Status: Using production API format')
    console.log('🔄 Next Step: Switch to development environment to test new format')
  } else if (environment === 'development') {
    console.log('📍 Status: Using development API format with mappings')
    console.log('⚠️ Reminder: Update key mappings in config/api-mappings.ts if needed')
  }
  
  console.groupEnd()
}

/**
 * Test API endpoint with both formats
 * Useful for testing during migration
 */
export async function testApiEndpoint(
  endpoint: string, 
  params: any, 
  expectedResponseShape: any
) {
  if (process.env.NODE_ENV !== 'development') return

  console.group(`🧪 Testing API Endpoint: ${endpoint}`)
  
  try {
    // This would need to be implemented based on your specific API client
    console.log('Parameters:', params)
    console.log('Expected Shape:', expectedResponseShape)
    console.log('✅ Test setup complete - implement actual API call')
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
  
  console.groupEnd()
} 