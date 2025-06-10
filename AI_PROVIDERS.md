# AI Providers Configuration

This project supports multiple AI providers through the Vercel AI SDK. You can easily switch between different providers and models.

## Supported Providers

### 1. OpenAI

- **Models**: GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo
- **Embeddings**: text-embedding-ada-002
- **Environment Variable**: `OPENAI_API_KEY`

### 2. Google Gemini

- **Models**: Gemini-1.5-pro, Gemini-1.5-flash, Gemini-pro
- **Embeddings**: text-embedding-004
- **Environment Variable**: `GOOGLE_GENERATIVE_AI_API_KEY`

### 3. Anthropic Claude

- **Models**: Claude-3.5-sonnet, Claude-3.5-haiku, Claude-3-opus
- **Embeddings**: Not supported (fallback to OpenAI)
- **Environment Variable**: `ANTHROPIC_API_KEY`

### 4. xAI Grok

- **Models**: Grok-beta, Grok-vision-beta
- **Embeddings**: Not supported (fallback to OpenAI)
- **Environment Variable**: `XAI_API_KEY`

## Setup

1. **Install Dependencies**: All required AI SDK packages are already installed
2. **Environment Variables**: Add your API keys to `.env.local`
3. **Default Provider**: Set `DEFAULT_AI_PROVIDER` and `DEFAULT_AI_MODEL` in your environment

### Example .env.local

```env
# Default AI Configuration
DEFAULT_AI_PROVIDER=openai
DEFAULT_AI_MODEL=gpt-4o

# AI Provider API Keys
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=AI...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...

# Other environment variables...
```

## Usage

### In the UI

1. Click the Settings icon in the chat interface
2. Select your preferred AI provider
3. Choose the model you want to use
4. Start chatting!

### Programmatically

```typescript
import { getLanguageModel } from '@/lib/ai-providers';

// Get a specific model
const model = getLanguageModel('openai', 'gpt-4o');

// Use with streamText
const result = await streamText({
  model,
  messages: [...],
});
```

## API Endpoints

### POST /api/chat

Send chat messages with optional provider and model selection:

```json
{
  "messages": [...],
  "provider": "openai",
  "model": "gpt-4o"
}
```

### GET /api/test-providers

Test all configured AI providers to check their availability.

## Features

- ✅ Multiple AI provider support
- ✅ Dynamic provider switching
- ✅ Automatic embedding fallback for providers without embedding support
- ✅ Environment-based default configuration
- ✅ Type-safe provider and model selection
- ✅ Error handling and validation
- ✅ Provider availability testing

## Architecture

The system is built with modularity in mind:

- `src/lib/ai-providers.ts` - Core provider configuration and management
- `src/lib/embeddings.ts` - Embedding generation with fallback support
- `src/components/main/ai-provider-selector.tsx` - UI component for provider selection
- `src/app/api/chat/route.ts` - Main chat API with provider support
- `src/app/api/test-providers/route.ts` - Provider testing endpoint

## Adding New Providers

To add a new AI provider:

1. Install the provider's AI SDK package
2. Add provider configuration to `AI_PROVIDER_CONFIG`
3. Update the `getAIProvider` function
4. Add environment variable for API key
5. Update TypeScript types

Example:

```typescript
// Add to AI_PROVIDER_CONFIG
newProvider: {
  name: 'New Provider',
  models: { 'model-1': 'model-1' },
  embeddingModel: 'embedding-model',
  apiKeyEnv: 'NEW_PROVIDER_API_KEY',
}
```

## Troubleshooting

- **Missing API Key**: Check your environment variables
- **Model Not Available**: Verify the model name is correct for the provider
- **Embedding Errors**: OpenAI API key is required for embedding fallback
- **Provider Errors**: Use the test endpoint to verify provider configuration
