import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Next.js 16 Upgrade Verification', () => {
  describe('Package Versions', () => {
    it('should have Next.js 16.x installed', async () => {
      const packageJsonPath = path.resolve(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      
      // Check package.json specifies ^16.0.0
      expect(packageJson.dependencies.next).toMatch(/^\^?16\./)
    })

    it('should have React 19.x installed', async () => {
      const packageJsonPath = path.resolve(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      
      // Check package.json specifies ^19.0.0
      expect(packageJson.dependencies.react).toMatch(/^\^?19\./)
      expect(packageJson.dependencies['react-dom']).toMatch(/^\^?19\./)
    })

    it('should have React 19 type definitions', async () => {
      const packageJsonPath = path.resolve(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      
      expect(packageJson.devDependencies['@types/react']).toMatch(/^\^?19\./)
      expect(packageJson.devDependencies['@types/react-dom']).toMatch(/^\^?19\./)
    })

    it('should have ESLint 9.x for Next.js 16 compatibility', async () => {
      const packageJsonPath = path.resolve(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      
      expect(packageJson.devDependencies.eslint).toMatch(/^\^?9\./)
      expect(packageJson.devDependencies['eslint-config-next']).toMatch(/^\^?16\./)
    })
  })

  describe('Next.js Configuration', () => {
    it('should have cacheComponents enabled in next.config.js', async () => {
      const configPath = path.resolve(process.cwd(), 'next.config.js')
      const configContent = fs.readFileSync(configPath, 'utf-8')
      
      // Check that cacheComponents is set to true (at top level, not in experimental)
      expect(configContent).toMatch(/cacheComponents:\s*true/)
    })

    it('should use ES module export syntax', async () => {
      const configPath = path.resolve(process.cwd(), 'next.config.js')
      const configContent = fs.readFileSync(configPath, 'utf-8')
      
      // Check for ES module export
      expect(configContent).toContain('export default')
      // Should not use CommonJS
      expect(configContent).not.toContain('module.exports')
    })

    it('should maintain existing experimental flags', async () => {
      const configPath = path.resolve(process.cwd(), 'next.config.js')
      const configContent = fs.readFileSync(configPath, 'utf-8')
      
      // Check that optimizePackageImports is still present
      expect(configContent).toContain('optimizePackageImports')
    })
  })
})
