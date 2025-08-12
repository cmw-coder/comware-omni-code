# Comware Omni Code

A VS Code extension that provides AI-powered code completion, chat assistance, code editing, and agent capabilities similar to GitHub Copilot.

## Features

### 🤖 Inline Code Completion
- AI-powered code completions as you type
- Context-aware suggestions
- Supports multiple programming languages

### 💬 Chat Panel
- Interactive chat interface with AI assistant
- Ask questions about code, get explanations, and receive coding help
- Persistent conversation history
- Located in the sidebar with the robot icon

### ✏️ Code Editing
- Select code and use AI to edit it based on instructions
- Right-click on selected code and choose "Edit Code with AI"
- Or use the Edit mode in the chat panel

### 🎯 AI Agent
- Describe complex tasks and let the AI agent help you plan and execute them
- Use the Agent mode in the chat panel
- Get detailed plans and code suggestions for development tasks

## Getting Started

1. **Configure API Settings**: 
   - Open VS Code Settings (Ctrl+,)
   - Search for "Comware Omni"
   - Set your OpenAI API URL and API Key
   - Configure model settings (default: gpt-3.5-turbo)

2. **Open the Chat Panel**:
   - Click the robot icon in the Activity Bar (left sidebar)
   - Or use Command Palette (Ctrl+Shift+P) → "Comware Omni: Open Chat Panel"

3. **Use Different Modes**:
   - **Chat**: Ask questions and get AI assistance
   - **Edit**: Select code first, then describe how to modify it
   - **Agent**: Describe complex tasks for AI planning and guidance

## Commands

- `Comware Omni: Open Chat Panel` - Opens the chat interface
- `Comware Omni: Start Chat Session` - Opens chat panel with welcome message
- `Comware Omni: Edit Code with AI` - Edit selected code with AI assistance
- `Comware Omni: Run AI Agent` - Start an agent task

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `comware-omni-code.apiUrl` | `https://api.openai.com/v1/chat/completions` | OpenAI API endpoint |
| `comware-omni-code.apiKey` | `""` | Your OpenAI API key |
| `comware-omni-code.model` | `gpt-3.5-turbo` | AI model to use |
| `comware-omni-code.maxTokens` | `50` | Maximum tokens for completions |
| `comware-omni-code.temperature` | `0.5` | Sampling temperature |

## Usage Examples

### Chat Mode
```
User: How do I create a REST API in Express.js?
AI: Here's how to create a basic REST API with Express.js...
```

### Edit Mode
1. Select some code in the editor
2. Switch to Edit mode in the chat panel
3. Type: "Add error handling to this function"
4. The AI will modify your selected code

### Agent Mode
```
User: Help me build a todo app with React and localStorage
AI: I'll help you build a todo app. Here's a comprehensive plan:
1. Set up the React component structure
2. Create state management for todos
3. Implement localStorage persistence
...
```

## Development

To set up the development environment:

1. Clone the repository
2. Run `pnpm install` to install dependencies
3. Run `pnpm run compile` to build the extension
4. Press F5 to launch a new VS Code window with the extension

## Architecture

The extension consists of several key components:

- **InlineCompletionProvider**: Handles inline code completions
- **ChatPanelService**: Manages the webview chat interface
- **OpenAIClient**: Handles API communication with OpenAI
- **ConfigurationService**: Manages extension settings

## License

[Add your license information here]
