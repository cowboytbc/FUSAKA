# 🔧 Get @fusakaai User ID

## Quick Steps:

1. **Go to:** https://tweeterid.com/
2. **Enter:** `fusakaai`
3. **Copy the User ID number**
4. **Update your .env file:**

```env
BOT_USERNAME=fusakaai
BOT_USER_ID=YOUR_COPIED_USER_ID_HERE
```

## Alternative Method:

1. **Visit:** https://twitter.com/fusakaai
2. **Right-click → View Page Source**
3. **Search for:** `"id_str"`
4. **Copy the number after it**

## Or Use Twitter API (when not rate limited):

```bash
curl -X GET "https://api.twitter.com/2/users/by/username/fusakaai" \
     -H "Authorization: Bearer YOUR_BEARER_TOKEN"
```

## After Getting User ID:

Update your `.env` file:
```env
BOT_USERNAME=fusakaai
BOT_USER_ID=1234567890123456789  # Replace with actual ID
```

Then restart your bot!