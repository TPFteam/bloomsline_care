'use client'

import { motion, Variants, Transition } from 'framer-motion'
import { forwardRef } from 'react'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Search,
  Settings,
  User,
  Users,
  Home,
  Mail,
  Bell,
  Heart,
  Star,
  Bookmark,
  Share2,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Globe,
  Calendar,
  Clock,
  FileText,
  Folder,
  Image,
  Video,
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  Send,
  MessageCircle,
  Phone,
  MapPin,
  Navigation,
  Compass,
  Sun,
  Moon,
  Cloud,
  Zap,
  Wifi,
  Battery,
  Bluetooth,
  Printer,
  Copy,
  Clipboard,
  Save,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  ExternalLink,
  Link,
  Unlink,
  Filter,
  SlidersHorizontal,
  BarChart2,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Award,
  Gift,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Percent,
  Tag,
  Package,
  Truck,
  Store,
  Building2,
  Briefcase,
  GraduationCap,
  BookOpen,
  Lightbulb,
  Puzzle,
  Gamepad2,
  Sparkles,
  Wand2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Animation variants
const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 17,
}

// Use tween for keyframe animations (more than 2 values)
const keyframeTransition: Transition = {
  type: 'tween',
  duration: 0.4,
  ease: 'easeInOut',
}

const smoothTransition: Transition = {
  type: 'tween',
  duration: 0.3,
  ease: 'easeInOut',
}

// Arrow animations - simple two-value for spring
const arrowRightVariants: Variants = {
  initial: { x: 0 },
  animate: { x: 4 },
  hover: { x: 4 },
}

const arrowLeftVariants: Variants = {
  initial: { x: 0 },
  animate: { x: -4 },
  hover: { x: -4 },
}

// Check animation
const checkVariants: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
}

// Plus/Cross rotation
const rotateVariants: Variants = {
  initial: { rotate: 0 },
  animate: { rotate: 90 },
  hover: { rotate: 90, scale: 1.1 },
}

// Bounce animation - simple two-value for spring
const bounceVariants: Variants = {
  initial: { y: 0 },
  animate: { y: -4 },
  hover: { y: -2 },
}

// Scale animation - simple two-value for spring
const scaleVariants: Variants = {
  initial: { scale: 1 },
  animate: { scale: 1.15 },
  hover: { scale: 1.15 },
}

// Pulse animation - simple two-value for spring
const pulseVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: { scale: 1.1, opacity: 0.9 },
  hover: { scale: 1.1 },
}

// Shake animation - use tween transition
const shakeVariants: Variants = {
  initial: { x: 0 },
  animate: { x: 0 },
  hover: { x: 2 },
}

// Spin animation
const spinVariants: Variants = {
  initial: { rotate: 0 },
  animate: { rotate: 360 },
  hover: { rotate: 180 },
}

// Bell ring animation - simplified for spring
const bellVariants: Variants = {
  initial: { rotate: 0 },
  animate: { rotate: 15 },
  hover: { rotate: 10 },
}

// Heart beat animation - simplified for spring
const heartVariants: Variants = {
  initial: { scale: 1 },
  animate: { scale: 1.2 },
  hover: { scale: 1.2 },
}

// Chevron bounce - simplified for spring
const chevronDownVariants: Variants = {
  initial: { y: 0 },
  animate: { y: 3 },
  hover: { y: 2 },
}

const chevronUpVariants: Variants = {
  initial: { y: 0 },
  animate: { y: -3 },
  hover: { y: -2 },
}

// Search pulse - simplified for spring
const searchVariants: Variants = {
  initial: { scale: 1 },
  animate: { scale: 1.05 },
  hover: { scale: 1.1, rotate: -10 },
}

// Settings spin
const settingsVariants: Variants = {
  initial: { rotate: 0 },
  hover: { rotate: 90 },
  animate: { rotate: 360 },
}

// Sparkle animation - simplified for spring
const sparkleVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  animate: { scale: 1.2, rotate: 15 },
  hover: { scale: 1.2, rotate: 15 },
}

// Loading spinner
const loaderVariants: Variants = {
  animate: { rotate: 360 },
}

// Send animation (fly away)
const sendVariants: Variants = {
  initial: { x: 0, y: 0, rotate: 0 },
  hover: { x: 2, y: -2, rotate: -5 },
  animate: { x: [0, 4, 0], y: [0, -4, 0] },
}

// Eye blink
const eyeVariants: Variants = {
  initial: { scaleY: 1 },
  hover: { scaleY: [1, 0.1, 1] },
}

// Download bounce
const downloadVariants: Variants = {
  initial: { y: 0 },
  animate: { y: [0, 3, 0] },
  hover: { y: 2 },
}

// Upload bounce
const uploadVariants: Variants = {
  initial: { y: 0 },
  animate: { y: [0, -3, 0] },
  hover: { y: -2 },
}

// Refresh spin
const refreshVariants: Variants = {
  initial: { rotate: 0 },
  animate: { rotate: -360 },
  hover: { rotate: -180 },
}

// Component props type
interface AnimatedIconProps {
  className?: string
  size?: number
  strokeWidth?: number
  animateOnHover?: boolean
  animateOnRender?: boolean
  loop?: boolean
  loopDelay?: number
}

// Create animated icon wrapper
function createAnimatedIcon(
  Icon: LucideIcon,
  variants: Variants,
  transition: Transition = springTransition
) {
  const AnimatedIcon = forwardRef<HTMLDivElement, AnimatedIconProps>(
    (
      {
        className,
        size = 24,
        strokeWidth = 2,
        animateOnHover = true,
        animateOnRender = false,
        loop = false,
        loopDelay = 2,
      },
      ref
    ) => {
      return (
        <motion.div
          ref={ref}
          className={cn('inline-flex items-center justify-center', className)}
          variants={variants}
          initial="initial"
          animate={animateOnRender || loop ? 'animate' : undefined}
          whileHover={animateOnHover ? 'hover' : undefined}
          transition={{
            ...transition,
            ...(loop && {
              repeat: Infinity,
              repeatDelay: loopDelay,
            }),
          }}
        >
          <Icon size={size} strokeWidth={strokeWidth} />
        </motion.div>
      )
    }
  )
  AnimatedIcon.displayName = `Animated${Icon.displayName || 'Icon'}`
  return AnimatedIcon
}

// Export animated icons
export const AnimatedArrowRight = createAnimatedIcon(ArrowRight, arrowRightVariants)
export const AnimatedArrowLeft = createAnimatedIcon(ArrowLeft, arrowLeftVariants)
export const AnimatedCheck = createAnimatedIcon(Check, scaleVariants)
export const AnimatedX = createAnimatedIcon(X, rotateVariants)
export const AnimatedPlus = createAnimatedIcon(Plus, rotateVariants)
export const AnimatedMinus = createAnimatedIcon(Minus, scaleVariants)
export const AnimatedChevronDown = createAnimatedIcon(ChevronDown, chevronDownVariants)
export const AnimatedChevronUp = createAnimatedIcon(ChevronUp, chevronUpVariants)
export const AnimatedChevronRight = createAnimatedIcon(ChevronRight, arrowRightVariants)
export const AnimatedChevronLeft = createAnimatedIcon(ChevronLeft, arrowLeftVariants)
export const AnimatedSearch = createAnimatedIcon(Search, searchVariants)
export const AnimatedSettings = createAnimatedIcon(Settings, settingsVariants, smoothTransition)
export const AnimatedUser = createAnimatedIcon(User, bounceVariants)
export const AnimatedUsers = createAnimatedIcon(Users, bounceVariants)
export const AnimatedHome = createAnimatedIcon(Home, bounceVariants)
export const AnimatedMail = createAnimatedIcon(Mail, shakeVariants)
export const AnimatedBell = createAnimatedIcon(Bell, bellVariants)
export const AnimatedHeart = createAnimatedIcon(Heart, heartVariants)
export const AnimatedStar = createAnimatedIcon(Star, sparkleVariants)
export const AnimatedBookmark = createAnimatedIcon(Bookmark, bounceVariants)
export const AnimatedShare = createAnimatedIcon(Share2, scaleVariants)
export const AnimatedDownload = createAnimatedIcon(Download, downloadVariants)
export const AnimatedUpload = createAnimatedIcon(Upload, uploadVariants)
export const AnimatedTrash = createAnimatedIcon(Trash2, shakeVariants)
export const AnimatedEdit = createAnimatedIcon(Edit, scaleVariants)
export const AnimatedEye = createAnimatedIcon(Eye, eyeVariants)
export const AnimatedEyeOff = createAnimatedIcon(EyeOff, scaleVariants)
export const AnimatedLock = createAnimatedIcon(Lock, shakeVariants)
export const AnimatedUnlock = createAnimatedIcon(Unlock, bounceVariants)
export const AnimatedGlobe = createAnimatedIcon(Globe, spinVariants, { ...smoothTransition, duration: 3 })
export const AnimatedCalendar = createAnimatedIcon(Calendar, bounceVariants)
export const AnimatedClock = createAnimatedIcon(Clock, pulseVariants)
export const AnimatedFileText = createAnimatedIcon(FileText, bounceVariants)
export const AnimatedFolder = createAnimatedIcon(Folder, scaleVariants)
export const AnimatedImage = createAnimatedIcon(Image, scaleVariants)
export const AnimatedVideo = createAnimatedIcon(Video, pulseVariants)
export const AnimatedMusic = createAnimatedIcon(Music, bounceVariants)
export const AnimatedPlay = createAnimatedIcon(Play, scaleVariants)
export const AnimatedPause = createAnimatedIcon(Pause, scaleVariants)
export const AnimatedSkipForward = createAnimatedIcon(SkipForward, arrowRightVariants)
export const AnimatedSkipBack = createAnimatedIcon(SkipBack, arrowLeftVariants)
export const AnimatedVolume = createAnimatedIcon(Volume2, pulseVariants)
export const AnimatedVolumeMute = createAnimatedIcon(VolumeX, shakeVariants)
export const AnimatedMic = createAnimatedIcon(Mic, pulseVariants)
export const AnimatedMicOff = createAnimatedIcon(MicOff, shakeVariants)
export const AnimatedCamera = createAnimatedIcon(Camera, scaleVariants)
export const AnimatedSend = createAnimatedIcon(Send, sendVariants)
export const AnimatedMessage = createAnimatedIcon(MessageCircle, bounceVariants)
export const AnimatedPhone = createAnimatedIcon(Phone, shakeVariants)
export const AnimatedMapPin = createAnimatedIcon(MapPin, bounceVariants)
export const AnimatedNavigation = createAnimatedIcon(Navigation, arrowRightVariants)
export const AnimatedCompass = createAnimatedIcon(Compass, spinVariants, smoothTransition)
export const AnimatedSun = createAnimatedIcon(Sun, sparkleVariants)
export const AnimatedMoon = createAnimatedIcon(Moon, bounceVariants)
export const AnimatedCloud = createAnimatedIcon(Cloud, bounceVariants)
export const AnimatedZap = createAnimatedIcon(Zap, sparkleVariants)
export const AnimatedWifi = createAnimatedIcon(Wifi, pulseVariants)
export const AnimatedBattery = createAnimatedIcon(Battery, pulseVariants)
export const AnimatedBluetooth = createAnimatedIcon(Bluetooth, pulseVariants)
export const AnimatedPrinter = createAnimatedIcon(Printer, bounceVariants)
export const AnimatedCopy = createAnimatedIcon(Copy, scaleVariants)
export const AnimatedClipboard = createAnimatedIcon(Clipboard, bounceVariants)
export const AnimatedSave = createAnimatedIcon(Save, bounceVariants)
export const AnimatedRefresh = createAnimatedIcon(RefreshCw, refreshVariants)
export const AnimatedRotateCcw = createAnimatedIcon(RotateCcw, refreshVariants)
export const AnimatedRotateCw = createAnimatedIcon(RotateCw, spinVariants)
export const AnimatedMaximize = createAnimatedIcon(Maximize, scaleVariants)
export const AnimatedMinimize = createAnimatedIcon(Minimize, scaleVariants)
export const AnimatedExternalLink = createAnimatedIcon(ExternalLink, arrowRightVariants)
export const AnimatedLink = createAnimatedIcon(Link, scaleVariants)
export const AnimatedUnlink = createAnimatedIcon(Unlink, shakeVariants)
export const AnimatedFilter = createAnimatedIcon(Filter, bounceVariants)
export const AnimatedSliders = createAnimatedIcon(SlidersHorizontal, bounceVariants)
export const AnimatedBarChart = createAnimatedIcon(BarChart2, bounceVariants)
export const AnimatedPieChart = createAnimatedIcon(PieChart, spinVariants, smoothTransition)
export const AnimatedTrendingUp = createAnimatedIcon(TrendingUp, arrowRightVariants)
export const AnimatedTrendingDown = createAnimatedIcon(TrendingDown, arrowRightVariants)
export const AnimatedActivity = createAnimatedIcon(Activity, pulseVariants)
export const AnimatedTarget = createAnimatedIcon(Target, pulseVariants)
export const AnimatedAward = createAnimatedIcon(Award, sparkleVariants)
export const AnimatedGift = createAnimatedIcon(Gift, shakeVariants)
export const AnimatedCart = createAnimatedIcon(ShoppingCart, bounceVariants)
export const AnimatedCreditCard = createAnimatedIcon(CreditCard, bounceVariants)
export const AnimatedDollar = createAnimatedIcon(DollarSign, bounceVariants)
export const AnimatedPercent = createAnimatedIcon(Percent, scaleVariants)
export const AnimatedTag = createAnimatedIcon(Tag, bounceVariants)
export const AnimatedPackage = createAnimatedIcon(Package, bounceVariants)
export const AnimatedTruck = createAnimatedIcon(Truck, arrowRightVariants)
export const AnimatedStore = createAnimatedIcon(Store, bounceVariants)
export const AnimatedBuilding = createAnimatedIcon(Building2, bounceVariants)
export const AnimatedBriefcase = createAnimatedIcon(Briefcase, bounceVariants)
export const AnimatedGraduation = createAnimatedIcon(GraduationCap, bounceVariants)
export const AnimatedBookOpen = createAnimatedIcon(BookOpen, scaleVariants)
export const AnimatedLightbulb = createAnimatedIcon(Lightbulb, sparkleVariants)
export const AnimatedPuzzle = createAnimatedIcon(Puzzle, rotateVariants)
export const AnimatedGamepad = createAnimatedIcon(Gamepad2, shakeVariants)
export const AnimatedSparkles = createAnimatedIcon(Sparkles, sparkleVariants)
export const AnimatedWand = createAnimatedIcon(Wand2, sparkleVariants)
export const AnimatedLoader = createAnimatedIcon(Loader2, loaderVariants, { duration: 1, ease: 'linear' })
export const AnimatedAlertCircle = createAnimatedIcon(AlertCircle, pulseVariants)
export const AnimatedAlertTriangle = createAnimatedIcon(AlertTriangle, shakeVariants)
export const AnimatedInfo = createAnimatedIcon(Info, pulseVariants)
export const AnimatedHelp = createAnimatedIcon(HelpCircle, bounceVariants)
export const AnimatedCheckCircle = createAnimatedIcon(CheckCircle, scaleVariants)
export const AnimatedXCircle = createAnimatedIcon(XCircle, shakeVariants)

// Generic AnimatedIcon wrapper for any Lucide icon
interface GenericAnimatedIconProps extends AnimatedIconProps {
  icon: LucideIcon
  animation?: 'bounce' | 'scale' | 'shake' | 'spin' | 'pulse' | 'sparkle' | 'arrow-right' | 'arrow-left'
}

const animationVariantsMap: Record<string, Variants> = {
  bounce: bounceVariants,
  scale: scaleVariants,
  shake: shakeVariants,
  spin: spinVariants,
  pulse: pulseVariants,
  sparkle: sparkleVariants,
  'arrow-right': arrowRightVariants,
  'arrow-left': arrowLeftVariants,
}

export const AnimatedIcon = forwardRef<HTMLDivElement, GenericAnimatedIconProps>(
  (
    {
      icon: Icon,
      animation = 'scale',
      className,
      size = 24,
      strokeWidth = 2,
      animateOnHover = true,
      animateOnRender = false,
      loop = false,
      loopDelay = 2,
    },
    ref
  ) => {
    const variants = animationVariantsMap[animation] || scaleVariants

    return (
      <motion.div
        ref={ref}
        className={cn('inline-flex items-center justify-center', className)}
        variants={variants}
        initial="initial"
        animate={animateOnRender || loop ? 'animate' : undefined}
        whileHover={animateOnHover ? 'hover' : undefined}
        transition={{
          ...springTransition,
          ...(loop && {
            repeat: Infinity,
            repeatDelay: loopDelay,
          }),
        }}
      >
        <Icon size={size} strokeWidth={strokeWidth} />
      </motion.div>
    )
  }
)
AnimatedIcon.displayName = 'AnimatedIcon'
