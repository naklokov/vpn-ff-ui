import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import TelegramIcon from "@mui/icons-material/Telegram";

type SupportLinkItem = {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor?: string;
};

const SUPPORT_LINKS: SupportLinkItem[] = [
  {
    title: "Telegram",
    subtitle: "Написать в Telegram",
    href: "https://t.me/naklokov",
    icon: <TelegramIcon fontSize="small" sx={{ fill: "#3d9df2" }} />,
    iconBgColor: "#dff0ff",
  },
  {
    title: "ВКонтакте",
    subtitle: "Написать нам в ВК",
    href: "https://vk.ru/naklokov",
    icon: (
      <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1 }}>
        VK
      </Typography>
    ),
    iconBgColor: "#e6e9ff",
    iconColor: "#4a63d8",
  },
];

export function SupportPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
            p: { xs: 2.5, sm: 3 },
            bgcolor: "background.paper",
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h5" component="h1">
              Служба поддержки
            </Typography>
            <Typography color="text.secondary">
              Мы всегда на связи, помогаем в любое время суток
            </Typography>
          </Stack>
        </Box>

        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
            p: { xs: 2, sm: 2.5 },
            bgcolor: "background.paper",
          }}
        >
          <Stack spacing={1.5}>
            {SUPPORT_LINKS.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                underline="none"
                color="inherit"
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  transition:
                    "border-color 0.2s ease, background-color 0.2s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "action.hover",
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: item.iconBgColor,
                    color: item.iconColor ?? "primary.main",
                    width: 44,
                    height: 44,
                  }}
                >
                  {item.icon}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body1" fontWeight={700}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {item.subtitle}
                  </Typography>
                </Box>
                <ChevronRightRoundedIcon sx={{ color: "text.disabled" }} />
              </Link>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
