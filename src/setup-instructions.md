# Foster Care Data Explorer

A React-based web application for exploring foster care data across counties and states, built with modern UI components and interactive visualizations.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Create a new React project:**
   ```bash
   npx create-react-app foster-care-app
   cd foster-care-app
   ```

2. **Install dependencies:**
   ```bash
   npm install lucide-react
   ```

3. **Install Tailwind CSS (recommended):**
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

4. **Update tailwind.config.js:**
   ```javascript
   module.exports = {
     content: [
       "./src/**/*.{js,jsx,ts,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

5. **Replace the default files with the provided components:**
   - Copy all files from the artifacts above into your project
   - Maintain the folder structure as shown

### Project Structure
```
foster-care-app/
├── public/
├── src/
│   ├── components/
│   │   ├── LandingPage.jsx
│   │   ├── NationalView.jsx
│   │   ├── CountyView.jsx
│   │   ├── OrganizationView.jsx
│   │   └── StaticMap.jsx
│   ├── data/
│   │   └── mockData.js
│   ├── App.js
│   ├── App.css
│   └── index.js
├── package.json
└── README.md
```

### Running the App

```bash
npm start
```

The app will be available at `http://localhost:3000`

## 🎯 Features

- **Landing Page**: County selection with intuitive dropdown
- **National View**: Overview map with state-level statistics
- **County View**: Detailed county-specific data and trends
- **Organization View**: Local organization directory with filtering
- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Elements**: Hover effects, transitions, and dynamic content

## 🎨 Customization

### Adding New Counties
Edit `src/data/mockData.js` to add new counties:

```javascript
export const countyData = {
  'your-county-key': {
    name: 'Your County Name',
    population: 12345,
    // ... other data
  }
};
```

### Styling
- Main styles are in `src/App.css`
- Uses Tailwind CSS for utility classes
- Custom components have inline Tailwind classes

### Map Integration
The current implementation uses a static map placeholder. To integrate a real map:

1. Choose a mapping service (Google Maps, Mapbox, Leaflet)
2. Replace `StaticMap.jsx` with your chosen map component
3. Update the map interaction handlers

## 🔧 Development Tips

### Component Structure
Each view is a separate component making it easy to:
- Add new features to specific views
- Modify styling independently
- Test components in isolation

### State Management
Currently uses React's built-in state. For larger applications, consider:
- React Context for global state
- Redux for complex state management
- Zustand for lightweight state management

### Data Integration
Replace mock data with real API calls:
1. Create an API service layer
2. Use React Query or SWR for data fetching
3. Add loading states and error handling

## 📱 Responsive Design

The app is designed to work on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- **Netlify**: Drag and drop the `build` folder
- **Vercel**: Connect your GitHub repo
- **GitHub Pages**: Use `gh-pages` package
- **AWS S3**: Upload build folder to S3 bucket

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Tailwind styles not working:**
- Ensure Tailwind is properly installed and configured
- Check that the paths in `tailwind.config.js` are correct

**Icons not displaying:**
- Verify `lucide-react` is installed
- Check import statements in components

**Map not interactive:**
- This is expected with the current static implementation
- Follow map integration guide above for interactive maps

### Getting Help

- Check the browser console for error messages
- Ensure all dependencies are installed correctly
- Verify file paths and import statements
- Test with a fresh React installation