"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Trophy, User, Target, Zap, CheckCircle, XCircle, Calendar, Activity, Search, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CycleComparisonView } from "@/components/cycle-comparison-view"
import { useIVFStore } from "@/lib/store"
import type { PublicUserProfile, PublicCycle, IVFCycle } from "@/lib/types"
import { format, parseISO } from "date-fns"

export default function CycleComparisonPage() {
  const { cycles } = useIVFStore()
  const searchParams = useSearchParams()
  const [selectedUser, setSelectedUser] = useState<PublicUserProfile | null>(null)
  const [theirCycles, setTheirCycles] = useState<PublicCycle[]>([])
  const [selectedYourCycle, setSelectedYourCycle] = useState<IVFCycle | null>(null)
  const [selectedTheirCycle, setSelectedTheirCycle] = useState<PublicCycle | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Check if user was passed via URL params
  useEffect(() => {
    const username = searchParams.get('username')
    if (username) {
      fetchUserData(username)
    }
  }, [searchParams])

  const fetchUserData = async (username: string) => {
    setLoading(true)
    try {
      // Hardcoded user data for demo purposes
      const mockUsers: Record<string, { user: PublicUserProfile; cycles: PublicCycle[] }> = {
        'hopeful_mama': {
          user: {
            id: '2',
            username: 'hopeful_mama',
            displayName: 'Jessica',
            location: 'San Francisco, CA',
            joinedDate: '2023-09-22T00:00:00.000Z',
            totalCycles: 4,
            bio: 'PCOS warrior. Had some setbacks but finally got my rainbow baby!',
            isPublic: true
          },
          cycles: [
            {
              id: 'cycle-2-1',
              name: 'IVF #1 - Long Lupron',
              owner: { id: '2', username: 'hopeful_mama', displayName: 'Jessica' },
              cycleGoal: 'retrieval',
              cycleType: 'long-lupron',
              ageAtStart: 29,
              startDate: '2023-10-01T00:00:00.000Z',
              endDate: '2023-10-20T00:00:00.000Z',
              status: 'completed',
              hasOutcome: true,
              location: 'San Francisco, CA',
              daysCount: 20,
              outcome: {
                eggsRetrieved: 15,
                matureEggs: 12,
                fertilized: 8,
                blastocysts: 4,
                euploidBlastocysts: 2
              }
            },
            {
              id: 'cycle-2-2',
              name: 'IVF #2 - Antagonist',
              owner: { id: '2', username: 'hopeful_mama', displayName: 'Jessica' },
              cycleGoal: 'retrieval',
              cycleType: 'antagonist',
              ageAtStart: 30,
              startDate: '2024-03-15T00:00:00.000Z',
              endDate: '2024-03-30T00:00:00.000Z',
              status: 'completed',
              hasOutcome: true,
              location: 'San Francisco, CA',
              daysCount: 16,
              outcome: {
                eggsRetrieved: 12,
                matureEggs: 10,
                fertilized: 7,
                blastocysts: 3,
                euploidBlastocysts: 3
              }
            }
          ]
        },
        'sarah_ivf_journey': {
          user: {
            id: '1',
            username: 'sarah_ivf_journey',
            displayName: 'Sarah M.',
            location: 'Austin, TX',
            joinedDate: '2024-01-15T00:00:00.000Z',
            totalCycles: 2,
            bio: 'DOR diagnosis at 32. Sharing my journey to help others.',
            isPublic: true
          },
          cycles: [
            {
              id: 'cycle-1-1',
              name: 'First IVF - Antagonist',
              owner: { id: '1', username: 'sarah_ivf_journey', displayName: 'Sarah M.' },
              cycleGoal: 'retrieval',
              cycleType: 'antagonist',
              ageAtStart: 32,
              startDate: '2024-02-01T00:00:00.000Z',
              endDate: '2024-02-15T00:00:00.000Z',
              status: 'completed',
              hasOutcome: true,
              location: 'Austin, TX',
              daysCount: 15,
              outcome: {
                eggsRetrieved: 8,
                matureEggs: 6,
                fertilized: 4,
                blastocysts: 2,
                euploidBlastocysts: 1
              }
            }
          ]
        }
      }

      const data = mockUsers[username]
      if (data) {
        setSelectedUser(data.user)
        setTheirCycles(data.cycles.map(cycle => ({
          ...cycle,
          // Add outcome data for comparison
          outcome: (cycle as any).outcome
        })))
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearUser = () => {
    setSelectedUser(null)
    setTheirCycles([])
    setSelectedYourCycle(null)
    setSelectedTheirCycle(null)
    setSearchQuery("")
    setSearchResults([])
  }

  // Search functionality with mock data
  const mockUsers: PublicUserProfile[] = [
    {
      id: '2',
      username: 'hopeful_mama',
      displayName: 'Jessica',
      location: 'San Francisco, CA',
      joinedDate: '2023-09-22T00:00:00.000Z',
      totalCycles: 4,
      bio: 'PCOS warrior. Had some setbacks but finally got my rainbow baby!',
      isPublic: true
    },
    {
      id: '1',
      username: 'sarah_ivf_journey',
      displayName: 'Sarah M.',
      location: 'Austin, TX',
      joinedDate: '2024-01-15T00:00:00.000Z',
      totalCycles: 2,
      bio: 'DOR diagnosis at 32. Sharing my journey to help others.',
      isPublic: true
    }
  ]

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(true)
    
    // Simulate search delay
    setTimeout(() => {
      if (query.trim() === '') {
        setSearchResults([])
      } else {
        const filtered = mockUsers.filter(user => 
          user.displayName?.toLowerCase().includes(query.toLowerCase()) ||
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.location?.toLowerCase().includes(query.toLowerCase())
        )
        setSearchResults(filtered)
      }
      setIsSearching(false)
    }, 300)
  }

  const handleSelectUser = async (user: PublicUserProfile) => {
    setSelectedUser(user)
    setSearchQuery("")
    setSearchResults([])
    await fetchUserData(user.username)
  }

  // Helper function to get cycle outcome summary
  const getCycleSummary = (cycle: PublicCycle | IVFCycle) => {
    const outcome = 'outcome' in cycle ? cycle.outcome : undefined
    
    if (cycle.cycleGoal === 'retrieval' && outcome) {
      return {
        eggsRetrieved: outcome.eggsRetrieved || 0,
        matureEggs: outcome.matureEggs || 0,
        fertilized: outcome.fertilized || 0,
        blastocysts: outcome.blastocysts || 0,
        euploids: outcome.euploidBlastocysts || 0,
        hasOutcome: true
      }
    } else if (cycle.cycleGoal === 'transfer' && outcome) {
      const isSuccess = outcome.transferStatus === 'successful' || 
                       outcome.liveBirth === 'yes' ||
                       (outcome.betaHcg1 && outcome.betaHcg1 >= 25) || 
                       (outcome.betaHcg2 && outcome.betaHcg2 >= 25)
      return {
        transferSuccess: isSuccess,
        betaHcg1: outcome.betaHcg1,
        betaHcg2: outcome.betaHcg2,
        hasOutcome: true
      }
    } else if (cycle.cycleGoal === 'iui' && outcome) {
      const isSuccess = outcome.transferStatus === 'successful' || 
                       outcome.liveBirth === 'yes' ||
                       (outcome.betaHcg1 && outcome.betaHcg1 >= 25) || 
                       (outcome.betaHcg2 && outcome.betaHcg2 >= 25)
      return {
        iuiSuccess: isSuccess,
        betaHcg1: outcome.betaHcg1,
        betaHcg2: outcome.betaHcg2,
        hasOutcome: true
      }
    }
    
    return { hasOutcome: false }
  }

  // Helper function to render cycle card
  const renderCycleCard = (cycle: PublicCycle | IVFCycle, isYours: boolean = false, isSelected: boolean = false) => {
    const summary = getCycleSummary(cycle)
    
    // Check if this cycle can be selected based on existing selection
    const canSelect = () => {
      if (isYours) {
        // Selecting your cycle
        if (!selectedTheirCycle) return true // No other cycle selected yet
        return cycle.cycleGoal === selectedTheirCycle.cycleGoal // Must match their cycle type
      } else {
        // Selecting their cycle
        if (!selectedYourCycle) return true // No other cycle selected yet
        return cycle.cycleGoal === selectedYourCycle.cycleGoal // Must match your cycle type
      }
    }
    
    const isDisabled = !canSelect()
    
    const onSelect = () => {
      if (isDisabled) return
      
      if (isYours) {
        setSelectedYourCycle(cycle as IVFCycle)
      } else {
        setSelectedTheirCycle(cycle as PublicCycle)
      }
    }
    
    return (
      <Card 
        key={cycle.id} 
        className={`transition-all border-l-4 ${
          cycle.cycleGoal === 'retrieval' ? 'border-l-blue-500' : 
          cycle.cycleGoal === 'transfer' ? 'border-l-green-500' :
          'border-l-purple-500'
        } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''} ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'
        }`}
        onClick={onSelect}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{cycle.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {cycle.cycleGoal === 'retrieval' ? 'Egg Retrieval' : 
                   cycle.cycleGoal === 'transfer' ? 'Transfer' : 'IUI'}
                </Badge>
                <Badge variant="secondary">{cycle.cycleType}</Badge>
                {cycle.ageAtStart && <Badge variant="outline">Age {cycle.ageAtStart}</Badge>}
                {isDisabled && (
                  <Badge variant="destructive" className="text-xs">
                    Incompatible Type
                  </Badge>
                )}
              </div>
            </div>
            {isSelected && (
              <CheckCircle className="h-5 w-5 text-blue-600" />
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Date */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Started {format(parseISO(cycle.startDate), "MMM d, yyyy")}
            </div>
            
            {/* Outcome Summary */}
            {summary.hasOutcome ? (
              <div className="space-y-2">
                {cycle.cycleGoal === 'retrieval' && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Eggs:</span>
                      <span className="font-medium">{(summary as any).eggsRetrieved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mature:</span>
                      <span className="font-medium">{(summary as any).matureEggs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fertilized:</span>
                      <span className="font-medium">{(summary as any).fertilized}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Blasts:</span>
                      <span className="font-medium">{(summary as any).blastocysts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Euploids:</span>
                      <span className="font-medium text-green-600">{(summary as any).euploids}</span>
                    </div>
                  </div>
                )}
                
                {(cycle.cycleGoal === 'transfer' || cycle.cycleGoal === 'iui') && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Result:</span>
                      <div className="flex items-center gap-1">
                        {((summary as any).transferSuccess || (summary as any).iuiSuccess) ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          ((summary as any).transferSuccess || (summary as any).iuiSuccess) ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {((summary as any).transferSuccess || (summary as any).iuiSuccess) ? 'Successful' : 'Unsuccessful'}
                        </span>
                      </div>
                    </div>
                    {(summary as any).betaHcg1 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Beta HCG:</span>
                        <span className="font-medium">{(summary as any).betaHcg1}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No outcome data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container max-w-7xl py-10">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
        <Link href="/compare" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to comparisons
        </Link>
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8" />
            Compare vs Other Members
          </h1>
          <p className="text-muted-foreground mt-1">
            Select specific cycles to compare side-by-side and analyze differences in protocols and outcomes
          </p>
        </div>

        {!selectedUser ? (
          // User Selection Phase
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Community Members</CardTitle>
                <CardDescription>
                  Search by username, display name, or location to find members to compare with
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for users (e.g., Jessica, hopeful_mama, San Francisco...)"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Search Results */}
                {searchQuery && (
                  <div className="space-y-3">
                    {isSearching ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <div className="animate-pulse">Searching...</div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Found {searchResults.length} member{searchResults.length !== 1 ? 's' : ''}:</p>
                        {searchResults.map(user => (
                          <Card 
                            key={user.id} 
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleSelectUser(user)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-blue-100 text-blue-600">
                                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {user.displayName || user.username}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>@{user.username}</span>
                                    {user.location && (
                                      <>
                                        <span>•</span>
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {user.location}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  {user.bio && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {user.bio}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline">
                                    {user.totalCycles} cycle{user.totalCycles !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 opacity-50" />
                          <p>No members found matching "{searchQuery}"</p>
                          <p className="text-sm">Try searching for "Jessica", "Sarah", or "San Francisco"</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Initial State */}
                {!searchQuery && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-12 w-12 opacity-50" />
                      <div>
                        <p className="font-medium">Start typing to search</p>
                        <p className="text-sm">Search by name, username, or location</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSearch("Jessica")}
                        >
                          Try "Jessica"
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSearch("Sarah")}
                        >
                          Try "Sarah"
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Cycle Selection and Comparison Phase
          <div className="space-y-6">
            {/* Selected User Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {(selectedUser.displayName || selectedUser.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedUser.displayName || selectedUser.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{selectedUser.username} • {selectedUser.location} • {theirCycles.length} cycles
                      </p>
                    </div>
                  </div>
                  
                  <Button variant="outline" onClick={handleClearUser}>
                    Change User
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cycle Selection */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Your Cycles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Your Cycles
                  </CardTitle>
                  <CardDescription>
                    Click on one of your cycles to select it for comparison
                    {selectedTheirCycle && (
                      <span className="block mt-1 text-amber-600 text-sm">
                        Only {selectedTheirCycle.cycleGoal === 'retrieval' ? 'Egg Retrieval' : 
                              selectedTheirCycle.cycleGoal === 'transfer' ? 'Transfer' : 'IUI'} cycles can be compared
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cycles.filter(c => c.outcome).length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No cycles with outcome data found</p>
                        <p className="text-sm">Add outcome data to your cycles to enable comparisons</p>
                      </div>
                    ) : (
                      cycles.filter(c => c.outcome).map(cycle => 
                        renderCycleCard(cycle, true, selectedYourCycle?.id === cycle.id)
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Their Cycles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      {(selectedUser.displayName || selectedUser.username).charAt(0).toUpperCase()}
                    </div>
                    {selectedUser.displayName || selectedUser.username}'s Cycles
                  </CardTitle>
                  <CardDescription>
                    Click on one of their cycles to select it for comparison
                    {selectedYourCycle && (
                      <span className="block mt-1 text-amber-600 text-sm">
                        Only {selectedYourCycle.cycleGoal === 'retrieval' ? 'Egg Retrieval' : 
                              selectedYourCycle.cycleGoal === 'transfer' ? 'Transfer' : 'IUI'} cycles can be compared
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {theirCycles.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No cycles available for this user</p>
                      </div>
                    ) : (
                      theirCycles.map(cycle => 
                        renderCycleCard(cycle, false, selectedTheirCycle?.id === cycle.id)
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Results */}
            {selectedYourCycle && selectedTheirCycle ? (
              <div className="space-y-4">
                {/* Selection Summary */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm font-medium">Your Cycle</p>
                          <Badge variant="default">{selectedYourCycle.name}</Badge>
                        </div>
                        <div className="text-2xl font-bold text-muted-foreground">VS</div>
                        <div className="text-center">
                          <p className="text-sm font-medium">Their Cycle</p>
                          <Badge variant="outline">{selectedTheirCycle.name}</Badge>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedYourCycle(null)
                          setSelectedTheirCycle(null)
                        }}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Comparison */}
                {selectedYourCycle.cycleGoal === selectedTheirCycle.cycleGoal ? (
                  <CycleComparisonView 
                    cycles={[selectedYourCycle, {
                      // Convert PublicCycle to IVFCycle format
                      id: selectedTheirCycle.id,
                      name: selectedTheirCycle.name,
                      cycleGoal: selectedTheirCycle.cycleGoal,
                      cycleType: selectedTheirCycle.cycleType,
                      ageAtStart: selectedTheirCycle.ageAtStart,
                      startDate: selectedTheirCycle.startDate,
                      endDate: selectedTheirCycle.endDate,
                      status: selectedTheirCycle.status,
                      days: (selectedTheirCycle as any).days || [],
                      outcome: (selectedTheirCycle as any).outcome,
                      createdAt: selectedTheirCycle.startDate,
                      // Add owner info for display
                      ownerInfo: {
                        displayName: selectedUser.displayName || selectedUser.username,
                        username: selectedUser.username
                      }
                    } as IVFCycle]}
                  />
                ) : (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2 text-amber-800 mb-2">
                        <Target className="h-5 w-5" />
                        <p className="font-medium">Different Cycle Types</p>
                      </div>
                      <p className="text-sm text-amber-700">
                        You've selected a {selectedYourCycle.cycleGoal} cycle and a {selectedTheirCycle.cycleGoal} cycle. 
                        Please select cycles of the same type for meaningful comparison.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="flex items-center gap-4 text-muted-foreground mb-4">
                    <Target className="h-12 w-12" />
                    <Zap className="h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Select Two Cycles to Compare</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Choose one of your cycles and one of {selectedUser.displayName || selectedUser.username}'s cycles to see a detailed side-by-side comparison.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}