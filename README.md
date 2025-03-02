# KidneyTalk-open

KidneyTalk-open is the open-source repository for the paper "KidneyTalk-open: No-code Deployment of a Private Large Language Model with Medical Documentation-Enhanced Knowledge Database for Kidney Disease".

This project aims to provide a no-code deployment system for private medical large language models, focusing on knowledge enhancement and clinical decision support in nephrology. The system integrates advanced open-source models and improves medical knowledge utilization through an adaptive retrieval augmentation framework. With its graphical interface design, clinical practitioners can conveniently manage medical documents and obtain AI-assisted decision support without programming skills.

Key Features:
- 🔒 Fully local deployment for patient privacy protection
- 📚 Support for integrating medical knowledge base with real-time retrieval augmentation
- 📋 Intelligent medical document processing
- 🖥️ Zero-barrier graphical interface
- 🔄 Adaptive knowledge retrieval framework

## Requirements

- **MacOS**: 13 or higher
- **Ollama**: Download and install Ollama from https://ollama.ai/. After installation, you can proceed with the next steps without worrying about Ollama anymore.

## Development

### Pre-requisites

- node >= 20.0.0
- yarn >= 1.22.0
- make >= 3.81

### Instructions

1. **Run development and use KidneyTalk-open Desktop**

   ```bash
   make dev
   ```

This will start the development server and open the desktop app.

### For production build

```bash
make build
```

## Acknowledgements

KidneyTalk-open builds on top of other open-source projects:

- [Jan](https://github.com/janhq/jan)
- [LangChain](https://github.com/langchain-ai)

## License

KidneyTalk-open is free and open source, under the **AGPLv3** license.
