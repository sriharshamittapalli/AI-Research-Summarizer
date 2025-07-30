// src/components/chat/suggested-questions.tsx
'use client'

interface SuggestedQuestionsProps {
  onQuestionSelect: (question: string) => void
  paperTitle: string
}

export function SuggestedQuestions({ onQuestionSelect, paperTitle }: SuggestedQuestionsProps) {
  const suggestions = [
    "What is the main contribution of this paper?",
    "Can you summarize the methodology?",
    "What are the key findings?",
    "Who are the authors and what are their backgrounds?",
    "What problem does this paper solve?",
    "How does this work compare to previous research?",
    "What are the practical applications?",
    "What are the limitations of this study?"
  ]

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        💡 Suggested questions about this paper:
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionSelect(question)}
            className="text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded border border-blue-200 transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}