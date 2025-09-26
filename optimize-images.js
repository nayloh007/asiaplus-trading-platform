import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = './client/src/assets';
const outputDir = './client/src/assets/optimized';

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// List of large images to optimize (over 1MB)
const largeImages = [
  'o.png',
  'p.png', 
  'e.png',
  'stock_market_graph.png',
  'stock_chart_bg.png',
  'q.png',
  'i.png',
  'r.png'
];

async function optimizeImages() {
  console.log('Starting image optimization...');
  
  for (const imageName of largeImages) {
    const inputPath = path.join(assetsDir, imageName);
    const outputName = imageName.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    const outputPath = path.join(outputDir, outputName);
    
    try {
      if (fs.existsSync(inputPath)) {
        console.log(`Optimizing ${imageName}...`);
        
        await sharp(inputPath)
          .resize(1920, 1080, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .webp({ 
            quality: 80,
            effort: 6 
          })
          .toFile(outputPath);
          
        const originalSize = fs.statSync(inputPath).size;
        const optimizedSize = fs.statSync(outputPath).size;
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        
        console.log(`✓ ${imageName} -> ${outputName}`);
        console.log(`  Original: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  Optimized: ${(optimizedSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  Savings: ${savings}%\n`);
      } else {
        console.log(`⚠ File not found: ${imageName}`);
      }
    } catch (error) {
      console.error(`❌ Error optimizing ${imageName}:`, error.message);
    }
  }
  
  console.log('Image optimization completed!');
}

optimizeImages().catch(console.error);