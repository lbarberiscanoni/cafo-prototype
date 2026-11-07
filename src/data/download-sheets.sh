#!/bin/bash

# MTE Data Pipeline - Download Google Sheets
# Usage: bash download-sheets.sh

echo "📥 Downloading MTE data files..."
echo ""

wget -O MTE_Metrics_2025.xlsx "https://docs.google.com/spreadsheets/d/12t05r-2urEy2Qaxvpqo7fVZN59QeI4RMH4qQ4JnSQGw/export?format=xlsx"
echo "✓ MTE_Metrics_2025.xlsx"

wget -O MTE_Metrics_2024.xlsx "https://docs.google.com/spreadsheets/d/1fokXgcbknCmLolfleR_Q4XiLwmNEqp6L-PnU8JFrrkg/export?format=xlsx"
echo "✓ MTE_Metrics_2024.xlsx"

wget -O Sources_and_Definitions.xlsx "https://docs.google.com/spreadsheets/d/1oLLSTmOaCc6H_vP9iKXZA1zmkfEuIAUv0NCb_71vMrI/export?format=xlsx"
echo "✓ Sources_and_Definitions.xlsx"

wget -O MTE_Master_Data.xlsx "https://docs.google.com/spreadsheets/d/1pQAlVEjvI4Ok9k1hSA2ANOdRiHekF3P0kkKV1tbXCmw/export?format=xlsx"
echo "✓ MTE_Master_Data.xlsx"

wget -O AFCARS.xlsx "https://docs.google.com/spreadsheets/d/1yFrhrOmVBSIzqFyuNBCtwfZD7WcXMihf-vYxZbDOdww/export?format=xlsx"
echo "✓ AFCARS.xlsx"

wget -O MTE_Church_Involvement.xlsx "https://docs.google.com/spreadsheets/d/1dEekJpkKfGO40Kos3mCp8hHypYD7nPRKqOgIlPTJBrw/export?format=xlsx"
echo "✓ MTE_Church_Involvement.xlsx"

echo ""
echo "✅ Done! Downloaded 6 files."
ls -lh *.xlsx