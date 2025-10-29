# Contributing to ZerOn

Thank you for your interest in contributing to ZerOn! This guide will help you understand how to contribute effectively.

## Getting Started

### Prerequisites
- Node.js 14+ and npm 6+
- Git
- Firebase account
- Gemini API key

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/ZerOn.git
   cd ZerOn
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Setup Environment**
   ```bash
   cp .env.example .env
   cd client && cp .env.example .env && cd ..
   ```

4. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Code Standards

#### JavaScript/Node.js
- Use ES6+ features
- Follow Airbnb style guide
- Use meaningful variable names
- Add JSDoc comments for functions

```javascript
/**
 * Scan a target domain for vulnerabilities
 * @param {string} domain - Target domain
 * @param {Object} options - Scan options
 * @param {string} options.plan - Subscription plan
 * @returns {Promise<Object>} Scan result
 */
async function scanDomain(domain, options) {
  // Implementation
}
```

#### React Components
- Use functional components with hooks
- Keep components focused and reusable
- Use PropTypes for type checking
- Follow naming conventions (PascalCase for components)

```javascript
import PropTypes from 'prop-types';

const VulnerabilityCard = ({ vulnerability }) => {
  return (
    <div className="vulnerability-card">
      {/* Component JSX */}
    </div>
  );
};

VulnerabilityCard.propTypes = {
  vulnerability: PropTypes.object.isRequired
};

export default VulnerabilityCard;
```

#### CSS
- Use CSS modules or scoped classes
- Follow BEM naming convention
- Mobile-first responsive design
- Maintain consistent spacing and colors

### File Structure

**Services (Backend)**
```
services/
├── Phase0/
│   ├── scopeService.js
│   ├── assetCatalog.js
│   └── ...
├── Phase1/
├── Phase2/
├── Phase3/
├── Phase4/
└── geminiIntegration.js
```

**Components (Frontend)**
```
src/
├── pages/
│   ├── Home.js
│   ├── ScanDashboard.js
│   └── Results.js
├── components/
│   ├── Navigation.js
│   ├── VulnerabilityList.js
│   └── ...
└── styles/
    ├── App.css
    └── ...
```

## Adding Features

### Adding a New Vulnerability Type

1. **Update vulnerabilityTemplates.js**
   ```javascript
   const vulnerabilities = {
     // Existing types...
     YOUR_NEW_TYPE: {
       name: 'Your Vulnerability Type',
       cwe: 'CWE-XXXX',
       payloads: [
         'payload1',
         'payload2'
       ],
       detectionStrings: [
         'detection_string1'
       ],
       templates: {
         description: 'Your description template',
         remediation: 'Your remediation template'
       }
     }
   };
   ```

2. **Add Detection Logic**
   - Update `exploitationEngine.js` if needed
   - Update `responseAnalyzer.js` for detection patterns
   - Add test cases

3. **Test**
   ```bash
   npm test -- vulnerabilityTemplates.test.js
   ```

4. **Document**
   - Update README.md with the new type
   - Add example to API.md

### Adding a New Bug-Bounty Platform

1. **Update bugBountyIntegration.js**
   ```javascript
   const formatters = {
     // Existing platforms...
     yourplatform: {
       format: (vulnerability) => ({
         // Platform-specific format
       }),
       headers: {
         // Platform-specific headers
       }
     }
   };
   ```

2. **Update server.js** endpoints if needed

3. **Update Frontend**
   - Add to `config.js` BUG_BOUNTY_PLATFORMS
   - Update `RemediationPanel.js` UI

### Adding a New Frontend Page

1. **Create Page Component**
   ```javascript
   // pages/YourPage.js
   import React, { useEffect, useState } from 'react';
   import api from '../api';

   function YourPage() {
     const [data, setData] = useState(null);

     useEffect(() => {
       // Fetch data
     }, []);

     return (
       <div className="your-page">
         {/* JSX */}
       </div>
     );
   }

   export default YourPage;
   ```

2. **Add Route in App.js**
   ```javascript
   <Route path="/your-page" element={<YourPage />} />
   ```

3. **Create Styles**
   ```css
   /* styles/YourPage.css */
   .your-page {
     /* Styles */
   }
   ```

4. **Add Navigation Link**
   - Update `Navigation.js` component

## Testing

### Backend Tests
```bash
npm test

# Specific test file
npm test -- vulnerabilityTemplates.test.js

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Frontend Tests
```bash
cd client
npm test

# Specific component
npm test -- VulnerabilityList.test.js

# Coverage
npm test -- --coverage
cd ..
```

### Manual Testing Checklist
- [ ] Feature works as intended
- [ ] No console errors (F12)
- [ ] Mobile responsive (test on 320px width)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Performance acceptable (no UI freezing)
- [ ] Accessibility (keyboard navigation, screen readers)

## Code Review Process

1. **Push to Your Branch**
   ```bash
   git add .
   git commit -m "Add feature: description"
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Provide clear description
   - Link any related issues
   - Include screenshots/GIFs if UI changes

3. **Respond to Feedback**
   - Make requested changes
   - Push updates to same branch
   - Request re-review

## Commit Guidelines

Use conventional commits:

```
feat: Add feature description
fix: Fix bug description
docs: Update documentation
style: Format code
refactor: Refactor code
perf: Improve performance
test: Add/update tests
chore: Update dependencies
```

Examples:
```bash
git commit -m "feat: Add SQL injection detection for POST parameters"
git commit -m "fix: Handle timeout errors in crawler service"
git commit -m "docs: Update API documentation for bug-bounty export"
git commit -m "refactor: Extract payload generation logic into utils"
```

## Performance Considerations

### Backend
- Minimize database queries (use batch operations)
- Cache frequently accessed data
- Use async/await properly
- Implement rate limiting
- Monitor memory usage

### Frontend
- Lazy load components with `React.lazy()`
- Memoize expensive computations
- Avoid unnecessary re-renders
- Optimize images and assets
- Use virtual lists for large datasets

## Security Considerations

- Never commit API keys or secrets
- Validate all user inputs
- Sanitize output for XSS prevention
- Use HTTPS for all communications
- Follow OWASP guidelines
- Report security issues privately

## Documentation

### README.md
- Update when adding features
- Keep installation instructions current
- Document new API endpoints

### API.md
- Document all API changes
- Include request/response examples
- Update error codes if changed

### Code Comments
```javascript
// Good: Explains why, not what
// Using SimHash for deduplication because it's fast and collision-resistant
const hash = simhash(payload);

// Bad: Explains what the code does
// Calculate simhash of payload
const hash = simhash(payload);
```

## Reporting Issues

### Bug Reports
```
Title: [BUG] Brief description

Environment:
- OS: (Windows/macOS/Linux)
- Node version:
- npm version:

Steps to reproduce:
1. ...
2. ...
3. ...

Expected behavior:
...

Actual behavior:
...

Error messages:
...
```

### Feature Requests
```
Title: [FEATURE] Brief description

Use case:
Why do you need this feature?

Proposed solution:
How should it work?

Alternatives:
Any other approaches?
```

## Community

- **Discussions**: GitHub Discussions for questions
- **Issues**: GitHub Issues for bugs and features
- **Discord**: Join our community server (link in README)
- **Email**: security@zeron.io for security issues

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (Check LICENSE file).

## Code of Conduct

- Be respectful and inclusive
- No harassment or discrimination
- Constructive feedback only
- Respect others' time and contributions

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

## Questions?

- Check existing documentation
- Search issues and discussions
- Ask in GitHub discussions
- Email: support@zeron.io

---

Thank you for contributing to ZerOn! 🚀
