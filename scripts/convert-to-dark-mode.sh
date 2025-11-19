#!/bin/bash
# Dark Mode Conversion Script
# This script converts light theme classes to dark theme classes across all pages

echo "🌙 Starting Dark Mode Conversion..."

# Directory to process
DIR="src/pages"

# Find all .jsx files and apply replacements
find "$DIR" -type f -name "*.jsx" | while read -r file; do
  echo "Processing: $file"
  
  # Background colors
  sed -i '' 's/bg-white /bg-gray-900 /g' "$file"
  sed -i '' 's/bg-gray-50 /bg-gray-800 /g' "$file"
  sed -i '' 's/bg-gray-100 /bg-gray-800 /g' "$file"
  
  # Text colors
  sed -i '' 's/text-gray-900 /text-gray-100 /g' "$file"
  sed -i '' 's/text-gray-800 /text-gray-200 /g' "$file"
  sed -i '' 's/text-gray-700 /text-gray-300 /g' "$file"
  sed -i '' 's/text-gray-600 /text-gray-400 /g' "$file"
  sed -i '' 's/text-gray-500 /text-gray-400 /g' "$file"
  
  # Border colors
  sed -i '' 's/border-gray-200 /border-gray-700 /g' "$file"
  sed -i '' 's/border-gray-300 /border-gray-600 /g' "$file"
  
  # Hover states
  sed -i '' 's/hover:bg-gray-50 /hover:bg-gray-800 /g' "$file"
  sed -i '' 's/hover:bg-gray-100 /hover:bg-gray-700 /g' "$file"
  sed -i '' 's/hover:text-gray-600 /hover:text-gray-200 /g' "$file"
  sed -i '' 's/hover:text-gray-700 /hover:text-gray-300 /g' "$file"
  
done

echo "✅ Dark Mode Conversion Complete!"
echo "Files have been updated with dark theme classes"
echo "Please review changes with: git diff"
