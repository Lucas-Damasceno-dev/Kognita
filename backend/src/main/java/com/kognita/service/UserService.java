package com.kognita.service;

import com.kognita.dto.CreateUserRequest;
import com.kognita.dto.UpdateUserRequest;
import com.kognita.dto.UserResponse;
import com.kognita.model.User;
import com.kognita.repository.UserRepository;
import com.kognita.repository.ChallengeAttemptRepository;
import com.kognita.repository.ErrorLogRepository;
import com.kognita.repository.StudySessionRepository;
import com.kognita.repository.SubjectRepository;
import java.util.UUID;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final ChallengeAttemptRepository challengeAttemptRepository;
    private final ErrorLogRepository errorLogRepository;
    private final StudySessionRepository studySessionRepository;
    private final SubjectRepository subjectRepository;
    private final com.kognita.repository.XpTransactionRepository xpTransactionRepository;

    public UserService(
        UserRepository repository,
        PasswordEncoder passwordEncoder,
        ChallengeAttemptRepository challengeAttemptRepository,
        ErrorLogRepository errorLogRepository,
        StudySessionRepository studySessionRepository,
        SubjectRepository subjectRepository,
        com.kognita.repository.XpTransactionRepository xpTransactionRepository
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.challengeAttemptRepository = challengeAttemptRepository;
        this.errorLogRepository = errorLogRepository;
        this.studySessionRepository = studySessionRepository;
        this.subjectRepository = subjectRepository;
        this.xpTransactionRepository = xpTransactionRepository;
    }

    public List<com.kognita.dto.AchievementResponse> getAchievements(UUID userId) {
        var user = repository.findById(userId).orElseThrow();
        
        long completedWithoutAi = challengeAttemptRepository.countByUserIdAndUsedAi(userId, false);
        long errorLogsCount = errorLogRepository.countByUserId(userId);
        long studySessionsCount = studySessionRepository.findByUserId(userId).size();
        long subjectsCount = subjectRepository.findByUserId(userId).size();
        
        // Calculate streak
        var dates = challengeAttemptRepository.findDistinctDatesWithoutAi(userId);
        int streak = 0;
        java.time.LocalDate today = java.time.LocalDate.now();
        if (!dates.isEmpty()) {
            java.time.LocalDate startCheckDate = today;
            if (!dates.get(0).equals(startCheckDate)) {
                if (dates.get(0).equals(startCheckDate.minusDays(1))) {
                    startCheckDate = startCheckDate.minusDays(1);
                } else {
                    startCheckDate = null;
                }
            }
            if (startCheckDate != null) {
                for (int i = 0; i < dates.size(); i++) {
                    java.time.LocalDate expected = startCheckDate.minusDays(i);
                    if (dates.get(i).equals(expected)) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
        }
        
        List<com.kognita.dto.AchievementResponse> achievements = new java.util.ArrayList<>();
        
        // 1. Mestre Autônomo
        boolean mestreUnlocked = completedWithoutAi >= 5;
        achievements.add(new com.kognita.dto.AchievementResponse(
            "mestre_autonomo",
            "Mestre Autônomo",
            "Complete pelo menos 5 desafios sem usar IA",
            "🛡️",
            mestreUnlocked,
            mestreUnlocked ? user.getCreatedAt() : null
        ));
        
        // 2. Inquebrável
        boolean inquebravelUnlocked = streak >= 7;
        achievements.add(new com.kognita.dto.AchievementResponse(
            "inquebravel",
            "Inquebrável",
            "Alcance uma sequência (streak) de 7 dias de estudos sem IA",
            "🔥",
            inquebravelUnlocked,
            inquebravelUnlocked ? user.getCreatedAt() : null
        ));
        
        // 3. Exorcista de Bugs
        boolean exorcistaUnlocked = errorLogsCount >= 1;
        achievements.add(new com.kognita.dto.AchievementResponse(
            "exorcista_bugs",
            "Exorcista de Bugs",
            "Registre e resolva seu primeiro erro no Diário de Erros",
            "🐞",
            exorcistaUnlocked,
            exorcistaUnlocked ? user.getCreatedAt() : null
        ));
        
        // 4. Foco Extremo
        boolean focoUnlocked = studySessionsCount >= 4;
        achievements.add(new com.kognita.dto.AchievementResponse(
            "foco_extremo",
            "Foco Extremo",
            "Complete pelo menos 4 sessões de foco (Pomodoro)",
            "⏱️",
            focoUnlocked,
            focoUnlocked ? user.getCreatedAt() : null
        ));
        
        // 5. Explorador Multidisciplinar
        boolean exploradorUnlocked = subjectsCount >= 3;
        achievements.add(new com.kognita.dto.AchievementResponse(
            "explorador",
            "Explorador Multidisciplinar",
            "Crie pelo menos 3 matérias de estudo diferentes",
            "🎒",
            exploradorUnlocked,
            exploradorUnlocked ? user.getCreatedAt() : null
        ));
        
        return achievements;
    }

    @Transactional
    public UserResponse findById(UUID id) {
        var user = repository.findById(id).orElseThrow();
        var checkedUser = checkStreakDecay(user);
        return UserResponse.from(checkedUser);
    }

    @Transactional
    public User save(User user) {
        return repository.save(user);
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        var user = new User(request.name(), request.email(), passwordEncoder.encode(request.password()));
        return UserResponse.from(repository.save(user));
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    public List<UserResponse> findAll() {
        return repository.findAll().stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest request) {
        var user = repository.findById(id).orElseThrow();

        if (request.name() != null) {
            user.setName(request.name());
        }
        if (request.email() != null) {
            user.setEmail(request.email());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }
        if (request.githubRepo() != null) {
            user.setGithubRepo(request.githubRepo());
        }
        if (request.title() != null) {
            user.setTitle(request.title());
        }
        if (request.avatarBorder() != null) {
            user.setAvatarBorder(request.avatarBorder());
        }
        if (request.streakCount() != null) {
            user.setStreakCount(request.streakCount());
        }
        if (request.lastActiveDate() != null) {
            user.setLastActiveDate(request.lastActiveDate());
        }
        if (request.streakFreezes() != null) {
            user.setStreakFreezes(request.streakFreezes());
        }
        if (request.currentPassword() != null && request.newPassword() != null) {
            if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
                throw new IllegalArgumentException("Current password is incorrect");
            }
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        }

        return UserResponse.from(repository.save(user));
    }

    User findEntityById(UUID id) {
        return repository.findById(id).orElseThrow();
    }

    @Transactional
    public User checkStreakDecay(User user) {
        if (user.getLastActiveDate() == null) {
            return user;
        }
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate lastActive = user.getLastActiveDate();

        if (lastActive.isBefore(today.minusDays(1))) {
            // Missed yesterday or more
            long daysMissed = java.time.temporal.ChronoUnit.DAYS.between(lastActive, today) - 1;
            while (daysMissed > 0 && user.getStreakFreezes() != null && user.getStreakFreezes() > 0) {
                user.setStreakFreezes(user.getStreakFreezes() - 1);
                lastActive = lastActive.plusDays(1);
                daysMissed--;
            }
            user.setLastActiveDate(lastActive);
            
            if (lastActive.isBefore(today.minusDays(1))) {
                user.setStreakCount(0);
            }
            return repository.save(user);
        }
        return user;
    }

    @Transactional
    public void registerActivity(UUID userId) {
        var user = repository.findById(userId).orElseThrow();
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate lastActive = user.getLastActiveDate();

        if (lastActive == null) {
            user.setLastActiveDate(today);
            user.setStreakCount(1);
            repository.save(user);
            return;
        }

        if (lastActive.equals(today)) {
            return; // Already active today
        }

        if (lastActive.equals(today.minusDays(1))) {
            user.setLastActiveDate(today);
            user.setStreakCount(user.getStreakCount() + 1);
            repository.save(user);
            return;
        }

        // Streak was broken! Check freezes
        if (user.getStreakFreezes() != null && user.getStreakFreezes() > 0) {
            user.setStreakFreezes(user.getStreakFreezes() - 1);
            user.setLastActiveDate(today); // streak preserved
            repository.save(user);
        } else {
            user.setStreakCount(1);
            user.setLastActiveDate(today);
            repository.save(user);
        }
    }

    @Transactional
    public UserResponse buyStreakFreeze(UUID userId) {
        var user = repository.findById(userId).orElseThrow();
        if (user.getTotalExperience() < 200) {
            throw new IllegalArgumentException("Experiência insuficiente para comprar congelador");
        }
        user.setTotalExperience(user.getTotalExperience() - 200);
        user.setStreakFreezes((user.getStreakFreezes() != null ? user.getStreakFreezes() : 0) + 1);
        return UserResponse.from(repository.save(user));
    }

    public List<UserResponse> getLeaderboard() {
        return repository.findAll().stream()
            .sorted((a, b) -> Long.compare(b.getTotalExperience(), a.getTotalExperience()))
            .map(UserResponse::from)
            .toList();
    }

    @Transactional
    public UserResponse buyTitle(UUID userId, String title, int cost) {
        var user = repository.findById(userId).orElseThrow();
        if (user.getTotalExperience() < cost) {
            throw new IllegalArgumentException("Experiência insuficiente para comprar título");
        }
        user.setTotalExperience(user.getTotalExperience() - cost);
        user.setTitle(title);
        
        var tx = new com.kognita.model.XpTransaction();
        tx.setUser(user);
        tx.setAmount(-cost);
        tx.setSource("SHOP");
        tx.setDescription("Compra de título: " + title);
        xpTransactionRepository.save(tx);
        
        return UserResponse.from(repository.save(user));
    }

    @Transactional
    public UserResponse buyBorder(UUID userId, String border, int cost) {
        var user = repository.findById(userId).orElseThrow();
        if (user.getTotalExperience() < cost) {
            throw new IllegalArgumentException("Experiência insuficiente para comprar borda");
        }
        user.setTotalExperience(user.getTotalExperience() - cost);
        user.setAvatarBorder(border);
        
        var tx = new com.kognita.model.XpTransaction();
        tx.setUser(user);
        tx.setAmount(-cost);
        tx.setSource("SHOP");
        tx.setDescription("Compra de borda de avatar: " + border);
        xpTransactionRepository.save(tx);
        
        return UserResponse.from(repository.save(user));
    }

    @Transactional
    public UserResponse claimDailyQuest(UUID userId) {
        var user = repository.findById(userId).orElseThrow();
        
        java.time.LocalDate today = java.time.LocalDate.now();
        java.util.List<com.kognita.model.XpTransaction> txs = xpTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        boolean alreadyClaimed = txs.stream()
            .filter(t -> "DAILY_QUEST".equals(t.getSource()))
            .anyMatch(t -> t.getCreatedAt().toLocalDate().equals(today));
            
        if (alreadyClaimed) {
            throw new IllegalArgumentException("Missão diária já resgatada hoje");
        }
        
        user.setTotalExperience(user.getTotalExperience() + 50);
        
        var tx = new com.kognita.model.XpTransaction();
        tx.setUser(user);
        tx.setAmount(50);
        tx.setSource("DAILY_QUEST");
        tx.setDescription("Missões diárias concluídas");
        xpTransactionRepository.save(tx);
        
        return UserResponse.from(repository.save(user));
    }
}
