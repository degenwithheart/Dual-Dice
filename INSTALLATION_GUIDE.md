# 🚀 Quick Installation Guide - Dice Dual

## Installation Steps

### Step 1: Copy Game Files

Copy the `DiceDual` folder to your platform:

```bash
cp -r DiceDual /path/to/your/platform-main/src/games/
```

### Step 2: Update Games Index

Add to `src/games/index.tsx`:

```typescript
{
  id: 'dicedual',
  meta: {
    background: '#4a1fb8',
    name: 'Dice Dual',
    image: '/games/dicedual.png',
    description: `
      Challenge an opponent to a 1v1 dice duel! Choose your dice count, 
      make your prediction (over/under/exact a target number), and compete 
      for the pot. Winner takes all in this fast-paced multiplayer dice game.
    `,
    tag: 'Multiplayer',
  },
  app: React.lazy(() => import('./DiceDual')),
},
```

**Place it at the beginning of the GAMES array** (before 'dice', 'slots', etc.)

### Step 3: Add Preview Image

Create or download a dice-themed image (512x512 PNG) and place it at:

```
public/games/dicedual.png
```

### Step 4: Test

```bash
cd /path/to/your/platform-main
pnpm install  # If not already done
pnpm dev
```

Navigate to http://localhost:5173 and select "Dice Dual"

## Using the Build Script (Alternative)

If you have the `build-dice-dual.sh` script:

```bash
# Make it executable
chmod +x build-dice-dual.sh

# Run it from your project root
cd /path/to/your/platform-main/..
bash build-dice-dual.sh
```

This automatically:
- Creates all game files
- Updates games index
- Sets up directory structure

## Verification Checklist

After installation, verify:

- [ ] Game appears in game selection menu
- [ ] Can select different tokens
- [ ] Can create a game
- [ ] Game appears in lobby
- [ ] Can join game (test with incognito window)
- [ ] Dice animation works
- [ ] Result displays correctly
- [ ] Payout is received

## Common Issues

### Game doesn't appear in menu

**Solution**: Make sure you added it to `src/games/index.tsx` and restarted dev server

### TypeScript errors

**Solution**: All dependencies should already be installed. If not:
```bash
pnpm install @gamba-labs/multiplayer-sdk gamba-react-v2 gamba-react-ui-v2
```

### 3D not rendering

**Solution**: Check browser console. Ensure WebGL is supported.

### Can't create game

**Solution**: 
- Check wallet is connected
- Ensure token is selected
- Verify sufficient balance
- Check RPC endpoint in `.env`

## Environment Variables

Make sure these are set in `.env` or `.env.local`:

```env
VITE_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
VITE_HELIUS_API_KEY=YOUR_KEY
```

## That's It!

You now have a fully functional multiplayer dice game integrated into your Gamba platform!

🎲 Happy gaming!
