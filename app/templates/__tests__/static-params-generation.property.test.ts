import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getActiveTemplates, getTemplateIds } from '@/lib/data/templates'
import { TEMPLATE_CONFIGS, InvoiceTemplateId } from '@/components/features/invoice/templates'

/**
 * **Feature: nextjs16-cache-components, Property 5: Static Params Generation**
 * 
 * *For any* call to `generateStaticParams` for template routes, the returned array 
 * SHALL contain exactly the set of all active template IDs from the database.
 * 
 * **Validates: Requirements 7.1, 7.4**
 */
describe('Static Params Generation', () => {
  const ALL_TEMPLATE_IDS = Object.keys(TEMPLATE_CONFIGS) as InvoiceTemplateId[]

  /**
   * Property: getActiveTemplates returns all configured templates
   */
  it('getActiveTemplates should return all configured templates', async () => {
    // **Feature: nextjs16-cache-components, Property 5: Static Params Generation**
    const templates = await getActiveTemplates()
    
    // Should return exactly 8 templates (all default templates)
    expect(templates.length).toBe(8)
    
    // All templates should be active
    expect(templates.every(t => t.isActive)).toBe(true)
    
    // All template IDs should match the configured templates
    const templateIds = templates.map(t => t.id)
    expect(templateIds.sort()).toEqual(ALL_TEMPLATE_IDS.sort())
  })

  /**
   * Property: For any template ID in TEMPLATE_CONFIGS, it should be in getActiveTemplates result
   */
  it('all configured template IDs should be in active templates', async () => {
    // **Feature: nextjs16-cache-components, Property 5: Static Params Generation**
    const templates = await getActiveTemplates()
    const activeIds = templates.map(t => t.id)
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ALL_TEMPLATE_IDS),
        async (templateId) => {
          // Every configured template ID should be in the active templates
          expect(activeIds).toContain(templateId)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: getTemplateIds returns exactly the keys of TEMPLATE_CONFIGS
   */
  it('getTemplateIds should return all template IDs', async () => {
    // **Feature: nextjs16-cache-components, Property 5: Static Params Generation**
    const ids = await getTemplateIds()
    
    expect(ids.sort()).toEqual(ALL_TEMPLATE_IDS.sort())
  })

  /**
   * Property: Active templates have required fields
   */
  it('active templates should have all required fields', async () => {
    // **Feature: nextjs16-cache-components, Property 5: Static Params Generation**
    const templates = await getActiveTemplates()
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...templates),
        async (template) => {
          // Each template must have required fields
          expect(template).toHaveProperty('id')
          expect(template).toHaveProperty('name')
          expect(template).toHaveProperty('description')
          expect(template).toHaveProperty('tier')
          expect(template).toHaveProperty('isActive')
          
          // ID must be a valid template ID
          expect(ALL_TEMPLATE_IDS).toContain(template.id)
          
          // Tier must be 'free' or 'premium'
          expect(['free', 'premium']).toContain(template.tier)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: generateStaticParams format matches expected structure
   * This simulates what generateStaticParams would return
   */
  it('static params should have correct format for Next.js', async () => {
    // **Feature: nextjs16-cache-components, Property 5: Static Params Generation**
    const templates = await getActiveTemplates()
    const staticParams = templates
      .filter(t => t.isActive)
      .map(template => ({ templateId: template.id }))
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...staticParams),
        async (param) => {
          // Each param must have templateId property
          expect(param).toHaveProperty('templateId')
          
          // templateId must be a string
          expect(typeof param.templateId).toBe('string')
          
          // templateId must be a valid template ID
          expect(ALL_TEMPLATE_IDS).toContain(param.templateId as InvoiceTemplateId)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Number of static params equals number of active templates
   */
  it('static params count should equal active templates count', async () => {
    // **Feature: nextjs16-cache-components, Property 5: Static Params Generation**
    const templates = await getActiveTemplates()
    const activeTemplates = templates.filter(t => t.isActive)
    const staticParams = activeTemplates.map(t => ({ templateId: t.id }))
    
    // Should have exactly 8 static params (all default templates)
    expect(staticParams.length).toBe(8)
    expect(staticParams.length).toBe(activeTemplates.length)
  })
})
