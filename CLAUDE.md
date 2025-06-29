# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a pavilion availability monitoring system for Expo reservations. The project aims to:

1. **Phase 1**: ✅ COMPLETED - Monitor specific pavilions for availability using the Expo API and send Slack notifications when spots become available
2. **Phase 2**: Automatically make reservations when conditions are met

## API Endpoints

- **Data API**: https://expo.ebii.net/api/data - Used to check pavilion availability
- **Add API**: https://expo.ebii.net/api/add - Used for making reservations (Phase 2)
- **Test Site**: https://expo.ebii.net/?mode=test - Reference site for testing

## Architecture

**Implemented System (Phase 1)**:
- Node.js/JavaScript monitoring application
- JSON-based configuration system
- Periodic API polling (configurable interval)
- Slack webhook notifications
- Error handling and logging
- Graceful shutdown handling

## Common Development Tasks

### Setup and Installation
```bash
npm install
cp config.sample.json config.json
# Edit config.json with your Slack webhook URL and pavilion preferences
npm start
```

### Testing
```bash
npm run dev  # Debug mode with verbose logging
```

### Configuration
- Edit `config.json` for Slack settings and pavilion monitoring
- Pavilion codes are listed in `PAVILION_LIST.md`
- API polling interval configurable (default: 2 seconds)

## File Structure

- `index.js` - Main monitoring application
- `config.json` - Runtime configuration (create from config.sample.json)
- `package.json` - Node.js dependencies and scripts
- `API_SPECIFICATION.md` - Detailed API documentation
- `PAVILION_LIST.md` - Complete pavilion code reference
- `README.md` - User documentation

## Key Implementation Details

### Pavilion Name Mapping
The system includes a complete mapping of pavilion codes to display names extracted from the reference implementation.

### Status Monitoring
- Status 0: Available (triggers notification)
- Status 1: Few remaining (triggers notification) 
- Status 2: Full (no notification)

### Slack Integration
Uses webhook for rich notifications including:
- Pavilion name and status
- Time slot information
- Direct reservation link generation

## Development Notes

- API rate limiting consideration (1-2 second intervals may be aggressive)
- No duplicate notification prevention (by design requirement)
- Includes graceful shutdown handling (SIGINT/SIGTERM)
- Debug mode available for development and troubleshooting
- Comprehensive error handling for API failures and network issues

## Make a notification with beep sound when Claude Code is waiting user input or the task is complete.

Use the command line below to notify the user every signle time Claude Code execution finishes, whether it's waiting for input or a task is complete.

```
osascript -e 'display notification "Waiting for your input" with title "Claude Code" sound name "Glass"'
```