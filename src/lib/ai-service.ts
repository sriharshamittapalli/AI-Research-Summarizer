// src/lib/ai-service.ts (Complete fixed version)
import { ArxivPaper } from './arxiv-service'

interface ChatContext {
  paper: ArxivPaper
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
}

interface AIResponse {
  content: string
  type: 'analysis' | 'summary' | 'methodology' | 'comparison' | 'general'
  confidence: number
}

interface Finding {
  category: string
  description: string
}

export class AIService {
  async generateResponse(
    userMessage: string, 
    context: ChatContext
  ): Promise<AIResponse> {
    const messageType = this.classifyMessage(userMessage)
    const paper = context.paper
    
    switch (messageType) {
      case 'summary':
        return this.generateSummaryResponse(paper)
      
      case 'methodology':
        return this.generateMethodologyResponse(userMessage, paper)
      
      case 'contribution':
        return this.generateContributionResponse(paper)
      
      case 'authors':
        return this.generateAuthorsResponse(paper)
      
      case 'findings':
        return this.generateFindingsResponse(paper)
      
      case 'comparison':
        return this.generateComparisonResponse(userMessage, paper, context.conversationHistory)
      
      case 'technical':
        return this.generateTechnicalResponse(userMessage, paper)
      
      default:
        return this.generateContextualResponse(userMessage, paper, context.conversationHistory)
    }
  }

  private classifyMessage(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize') || lowerMessage.includes('overview')) {
      return 'summary'
    }
    
    if (lowerMessage.includes('method') || lowerMessage.includes('approach') || lowerMessage.includes('technique')) {
      return 'methodology'
    }
    
    if (lowerMessage.includes('contribution') || lowerMessage.includes('novel') || lowerMessage.includes('innovation')) {
      return 'contribution'
    }
    
    if (lowerMessage.includes('author') || lowerMessage.includes('researcher') || lowerMessage.includes('who wrote')) {
      return 'authors'
    }
    
    if (lowerMessage.includes('result') || lowerMessage.includes('finding') || lowerMessage.includes('conclusion')) {
      return 'findings'
    }
    
    if (lowerMessage.includes('compare') || lowerMessage.includes('difference') || lowerMessage.includes('vs')) {
      return 'comparison'
    }
    
    if (lowerMessage.includes('algorithm') || lowerMessage.includes('equation') || lowerMessage.includes('formula')) {
      return 'technical'
    }
    
    return 'general'
  }

  private generateSummaryResponse(paper: ArxivPaper): AIResponse {
    const keyPoints = this.extractKeyPoints(paper.abstract)
    
    return {
      content: `## Paper Summary: ${paper.title}\n\n` +
               `**Authors:** ${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ' et al.' : ''}\n\n` +
               `**Published:** ${new Date(paper.published).toLocaleDateString()}\n\n` +
               `**Key Points:**\n${keyPoints.map(point => `• ${point}`).join('\n')}\n\n` +
               `**Research Area:** ${paper.categories[0]}\n\n` +
               `This paper focuses on ${this.generateFocusArea(paper.abstract)}. ` +
               `Would you like me to dive deeper into any specific aspect?`,
      type: 'summary',
      confidence: 0.9
    }
  }

  private generateMethodologyResponse(userMessage: string, paper: ArxivPaper): AIResponse {
    const methodKeywords = this.extractMethodologyKeywords(paper.abstract)
    
    return {
      content: `## Methodology Analysis\n\n` +
               `Based on the abstract, this paper employs several key methodological approaches:\n\n` +
               `${methodKeywords.map(keyword => `**${keyword}:** Mentioned in the context of ${this.getMethodContext(keyword, paper.abstract)}`).join('\n\n')}\n\n` +
               `The research appears to follow a ${this.inferResearchType(paper.abstract)} approach. ` +
               `The methodology section would contain detailed implementation specifics.\n\n` +
               `💡 **To fully understand the methodology, I'd recommend:**\n` +
               `• Reading Section 2-3 of the full paper\n` +
               `• Checking the experimental setup\n` +
               `• Looking at any supplementary materials\n\n` +
               `Would you like me to help identify specific technical terms or approaches mentioned?`,
      type: 'methodology',
      confidence: 0.8
    }
  }

  private generateContributionResponse(paper: ArxivPaper): AIResponse {
    const contributions = this.identifyContributions(paper.abstract)
    
    return {
      content: `## Main Contributions\n\n` +
               `Based on the paper "${paper.title}", the key contributions appear to be:\n\n` +
               `${contributions.map((contrib, index) => `${index + 1}. **${contrib.type}:** ${contrib.description}`).join('\n\n')}\n\n` +
               `These contributions advance the field of ${paper.categories[0]} by ${this.generateAdvancementDescription(paper.abstract)}.\n\n` +
               `**Impact:** This work likely influences future research in areas such as:\n` +
               `${this.generateImpactAreas(paper.categories, paper.abstract).map(area => `• ${area}`).join('\n')}\n\n` +
               `Would you like me to elaborate on any of these contributions?`,
      type: 'analysis',
      confidence: 0.85
    }
  }

  private generateAuthorsResponse(paper: ArxivPaper): AIResponse {
    const authorAnalysis = this.analyzeAuthors(paper.authors)
    
    return {
      content: `## Author Information\n\n` +
               `**Research Team:** ${paper.authors.length} author${paper.authors.length > 1 ? 's' : ''}\n\n` +
               `${paper.authors.map((author, index) => {
                 if (index === 0) return `**Lead Author:** ${author}`
                 if (index === paper.authors.length - 1 && paper.authors.length > 2) return `**Senior Author:** ${author}`
                 return `**Co-author:** ${author}`
               }).join('\n')}\n\n` +
               `${authorAnalysis.collaboration}\n\n` +
               `📚 **To learn more about these researchers:**\n` +
               `• Search for their other publications on ArXiv\n` +
               `• Check their institutional affiliations\n` +
               `• Look for their Google Scholar profiles\n\n` +
               `Would you like me to help you understand their roles in this research?`,
      type: 'analysis',
      confidence: 0.95
    }
  }

  private generateFindingsResponse(paper: ArxivPaper): AIResponse {
    const findings = this.extractFindings(paper.abstract)
    
    return {
      content: `## Key Findings & Results\n\n` +
               `From the abstract, the main findings include:\n\n` +
               `${findings.map(finding => `🔍 **${finding.category}:** ${finding.description}`).join('\n\n')}\n\n` +
               `**Research Implications:**\n` +
               `${this.generateImplications(paper.abstract, paper.categories).map(impl => `• ${impl}`).join('\n')}\n\n` +
               `⚠️ **Note:** These findings are extracted from the abstract. For detailed results, statistical significance, and complete analysis, please refer to the Results and Discussion sections of the full paper.\n\n` +
               `**Suggested Follow-up Questions:**\n` +
               `• "What methodology was used to achieve these results?"\n` +
               `• "How do these findings compare to previous work?"\n` +
               `• "What are the limitations of this study?"\n\n` +
               `What aspect of the findings interests you most?`,
      type: 'analysis',
      confidence: 0.8
    }
  }

  // Add the missing methods
  private generateComparisonResponse(
    userMessage: string, 
    paper: ArxivPaper, 
    conversationHistory: Array<{role: string; content: string; timestamp: string}>
  ): AIResponse {
    return {
      content: `## Comparison Analysis\n\n` +
               `You're asking about comparisons related to "${paper.title}".\n\n` +
               `**This paper's approach:** Based on the abstract, the methodology appears to involve ${this.generateFocusArea(paper.abstract)}.\n\n` +
               `**For detailed comparisons, I'd recommend:**\n` +
               `• Looking at the Related Work section\n` +
               `• Checking the experimental comparison tables\n` +
               `• Reviewing the discussion section\n\n` +
               `What specific aspect would you like me to compare?`,
      type: 'comparison',
      confidence: 0.7
    }
  }

  private generateTechnicalResponse(userMessage: string, paper: ArxivPaper): AIResponse {
    const technicalTerms = this.extractTechnicalTerms(paper.abstract)
    
    return {
      content: `## Technical Analysis\n\n` +
               `This paper discusses several technical concepts:\n\n` +
               `${technicalTerms.map(term => `**${term}:** Referenced in the research context`).join('\n\n')}\n\n` +
               `**Technical Focus:** ${this.generateFocusArea(paper.abstract)}\n\n` +
               `For detailed technical implementation, please refer to the full paper's technical sections.\n\n` +
               `What specific technical aspect interests you?`,
      type: 'analysis',
      confidence: 0.75
    }
  }

  private generateContextualResponse(
    userMessage: string, 
    paper: ArxivPaper, 
    conversationHistory: Array<{role: string; content: string; timestamp: string}>
  ): AIResponse {
    const context = this.buildConversationContext(conversationHistory)
    const relevantInfo = this.extractRelevantInfo(userMessage, paper.abstract)
    
    return {
      content: `Based on your question about "${paper.title}":

${relevantInfo}

${context ? `\n**Building on our previous discussion:** ${context}\n` : ''}

The paper's abstract suggests: "${paper.abstract.substring(0, 200)}..."

**I can help you explore:**
• Specific technical details mentioned in the abstract
• How this work relates to broader research trends
• Potential applications and implications
• Connections to other research areas

What specific aspect would you like to dive deeper into?`,
      type: 'general',
      confidence: 0.7
    }
  }

  // Helper methods for content analysis
  private extractKeyPoints(abstract: string): string[] {
    const sentences = abstract.split('.').filter(s => s.trim().length > 20)
    return sentences.slice(0, 4).map(s => s.trim().substring(0, 80) + '...')
  }

  private extractMethodologyKeywords(abstract: string): string[] {
    const methodWords = ['algorithm', 'method', 'approach', 'technique', 'framework', 'model', 'system', 'analysis', 'optimization', 'learning']
    return methodWords.filter(word => abstract.toLowerCase().includes(word))
  }

  private extractTechnicalTerms(abstract: string): string[] {
    const techWords = ['algorithm', 'neural', 'network', 'optimization', 'machine learning', 'deep learning', 'artificial intelligence']
    return techWords.filter(word => abstract.toLowerCase().includes(word.toLowerCase()))
  }

  private getMethodContext(keyword: string, abstract: string): string {
    const sentences = abstract.split('.')
    const relevantSentence = sentences.find(s => s.toLowerCase().includes(keyword.toLowerCase()))
    return relevantSentence ? relevantSentence.trim().substring(0, 100) + '...' : 'the research methodology'
  }

  private inferResearchType(abstract: string): string {
    if (abstract.toLowerCase().includes('experiment')) return 'experimental'
    if (abstract.toLowerCase().includes('survey')) return 'survey-based'
    if (abstract.toLowerCase().includes('theoretical')) return 'theoretical'
    if (abstract.toLowerCase().includes('empirical')) return 'empirical'
    return 'analytical'
  }

  private identifyContributions(abstract: string): Array<{type: string; description: string}> {
    const contributions = []
    
    if (abstract.toLowerCase().includes('novel') || abstract.toLowerCase().includes('new')) {
      contributions.push({
        type: 'Novel Approach',
        description: 'Introduces a new method or technique to the field'
      })
    }
    
    if (abstract.toLowerCase().includes('improve') || abstract.toLowerCase().includes('better')) {
      contributions.push({
        type: 'Performance Improvement',
        description: 'Enhances existing methods or achieves better results'
      })
    }
    
    if (abstract.toLowerCase().includes('analysis') || abstract.toLowerCase().includes('study')) {
      contributions.push({
        type: 'Analytical Contribution',
        description: 'Provides new insights through analysis or comprehensive study'
      })
    }
    
    return contributions.length > 0 ? contributions : [{
      type: 'Research Contribution',
      description: 'Advances the field through novel research findings'
    }]
  }

  private generateFocusArea(abstract: string): string {
    const keywords = abstract.toLowerCase()
    if (keywords.includes('machine learning')) return 'machine learning techniques and applications'
    if (keywords.includes('neural network')) return 'neural network architectures and optimization'
    if (keywords.includes('natural language')) return 'natural language processing and understanding'
    if (keywords.includes('computer vision')) return 'computer vision and image analysis'
    if (keywords.includes('optimization')) return 'optimization methods and algorithms'
    return 'advancing computational methods and theoretical understanding'
  }

  private generateAdvancementDescription(abstract: string): string {
    if (abstract.toLowerCase().includes('efficient')) return 'improving computational efficiency and scalability'
    if (abstract.toLowerCase().includes('accurate')) return 'enhancing accuracy and reliability of existing methods'
    if (abstract.toLowerCase().includes('novel')) return 'introducing innovative approaches and methodologies'
    return 'contributing new knowledge and methodological insights'
  }

  private generateImpactAreas(categories: string[], abstract: string): string[] {
    const baseAreas = categories.slice(0, 2)
    const additionalAreas = []
    
    if (abstract.toLowerCase().includes('application')) additionalAreas.push('practical applications')
    if (abstract.toLowerCase().includes('industry')) additionalAreas.push('industrial implementations')
    if (abstract.toLowerCase().includes('real-world')) additionalAreas.push('real-world deployments')
    
    return [...baseAreas, ...additionalAreas].slice(0, 4)
  }

  private analyzeAuthors(authors: string[]): {collaboration: string} {
    if (authors.length === 1) {
      return {
        collaboration: `This is a single-author work by ${authors[0]}, indicating independent research or a comprehensive individual contribution.`
      }
    } else if (authors.length <= 3) {
      return {
        collaboration: `This appears to be a collaborative effort between ${authors.length} researchers, suggesting close cooperation and shared expertise.`
      }
    } else {
      return {
        collaboration: `This is a large collaborative work with ${authors.length} contributors, likely involving multiple institutions or research groups.`
      }
    }
  }

  private extractFindings(abstract: string): Finding[] {
    const findings: Finding[] = []
    const sentences = abstract.split('.').filter(s => s.trim().length > 30)
    
    sentences.forEach(sentence => {
      const lower = sentence.toLowerCase()
      if (lower.includes('result') || lower.includes('show') || lower.includes('demonstrate')) {
        findings.push({
          category: 'Experimental Results',
          description: sentence.trim().substring(0, 120) + '...'
        })
      } else if (lower.includes('achieve') || lower.includes('obtain')) {
        findings.push({
          category: 'Performance Achievement',
          description: sentence.trim().substring(0, 120) + '...'
        })
      }
    })
    
    return findings.slice(0, 3)
  }

  private generateImplications(abstract: string, categories: string[]): string[] {
    const implications = []
    
    implications.push(`Advances research in ${categories[0]}`)
    
    if (abstract.toLowerCase().includes('practical')) {
      implications.push('Has potential for practical applications')
    }
    
    if (abstract.toLowerCase().includes('efficient')) {
      implications.push('Could improve computational efficiency in the field')
    }
    
    implications.push('May influence future research directions')
    
    return implications
  }

  private buildConversationContext(history: Array<{role: string; content: string; timestamp: string}>): string {
    if (history.length < 2) return ''
    
    const recentMessages = history.slice(-4)
    const topics = recentMessages
      .filter(msg => msg.role === 'user')
      .map(msg => this.extractTopicFromMessage(msg.content))
      .filter(topic => topic)
    
    return topics.length > 0 ? `We've been discussing ${topics.join(', ')}` : ''
  }

  private extractTopicFromMessage(message: string): string {
    const lower = message.toLowerCase()
    if (lower.includes('method')) return 'methodology'
    if (lower.includes('result')) return 'results'
    if (lower.includes('author')) return 'authors'
    if (lower.includes('contribution')) return 'contributions'
    return ''
  }

  private extractRelevantInfo(question: string, abstract: string): string {
    const questionWords = question.toLowerCase().split(' ')
    const sentences = abstract.split('.').filter(s => s.trim().length > 20)
    
    // Find sentences that contain words from the question
    const relevantSentences = sentences.filter(sentence => {
      const sentenceWords = sentence.toLowerCase().split(' ')
      return questionWords.some(qWord => sentenceWords.some(sWord => sWord.includes(qWord)))
    })
    
    if (relevantSentences.length > 0) {
      return `From the abstract, here's what's relevant to your question:\n\n"${relevantSentences[0].trim()}..."`
    }
    
    return `While the abstract doesn't directly address your specific question, it provides context about the research focus.`
  }
}