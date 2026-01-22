package com.eisoo.dc.common.util;

import java.util.Map;
import java.util.Objects;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 多任务并发锁：为不同任务（通过任务标识区分）提供独立的锁控制，
 * 支持同一任务串行执行、不同任务并行执行，解决多任务并发冲突问题。
 *
 * @author Tian.lan
 */
public class GlobalMultiTaskLock {

    // 存储任务标识与锁信息的映射（线程安全的ConcurrentHashMap）
    private final Map<Object, TaskLockInfo> taskLocks = new ConcurrentHashMap<>();
//    // 锁超时检查器（防止死锁）
//    private final ScheduledExecutorService timeoutExecutor;
//    // 全局默认锁持有超时时间（防止永久占用）
//    private final long defaultHoldTimeout;
//    private final TimeUnit defaultTimeUnit;

    /**
     * 任务锁信息：封装锁实例、重入计数和超时时间
     */
    private static class TaskLockInfo {
        final ReentrantLock lock;         // 可重入锁（支持公平/非公平）
        final AtomicInteger holdCount;    // 重入计数器（原子操作保证线程安全）
        final Object taskKey;             // 任务标识
        volatile long lastActiveTime;     // 最后一次操作时间（用于超时判断）

        TaskLockInfo(Object taskKey, boolean fair) {
            this.taskKey = taskKey;
            this.lock = new ReentrantLock(fair);
            this.holdCount = new AtomicInteger(1);
            this.lastActiveTime = System.currentTimeMillis();
        }

        // 更新活动时间（续期）
        void updateActiveTime() {
            this.lastActiveTime = System.currentTimeMillis();
        }
    }

//    /**
//     * 构造器：初始化超时检查线程池
//     *
//     * @param defaultHoldTimeout 锁默认持有超时时间（超时将被强制释放）
//     * @param defaultTimeUnit    时间单位
//     */
//    public GlobalMultiTaskLock(long defaultHoldTimeout, TimeUnit defaultTimeUnit) {
//        this.defaultHoldTimeout = defaultHoldTimeout;
//        this.defaultTimeUnit = defaultTimeUnit;
//        this.timeoutExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
//            Thread t = new Thread(r, "multi-task-lock-timeout-checker");
//            t.setDaemon(true); // 守护线程，主程序退出时自动销毁
//            return t;
//        });
//        // 每10秒检查一次超时锁（频率可根据业务调整）
//        this.timeoutExecutor.scheduleAtFixedRate(
//                this::checkAndReleaseTimeoutLocks,
//                10, 10, TimeUnit.SECONDS
//        );
//    }

    /**
     * 获取指定任务的锁（阻塞式，使用默认超时）
     *
     * @param taskKey 任务唯一标识（如订单ID、用户ID）
     * @throws InterruptedException 线程中断
     * @throws TimeoutException     获取锁超时
     */
    public void lock(Object taskKey) throws InterruptedException, TimeoutException {
        lock(taskKey, 0, null, false);
    }

    /**
     * 获取指定任务的锁（带超时和公平性配置）
     *
     * @param taskKey        任务标识
     * @param acquireTimeout 获取锁的等待超时时间（0表示不超时，一直等待）
     * @param acquireUnit    等待超时的时间单位（可为null，此时使用默认超时策略）
     * @param fair           是否使用公平锁（true=按等待顺序获取，false=非公平，性能更高）
     * @throws InterruptedException 线程中断
     * @throws TimeoutException     获取锁超时
     */
    public void lock(Object taskKey, long acquireTimeout, TimeUnit acquireUnit, boolean fair)
            throws InterruptedException, TimeoutException {
        Objects.requireNonNull(taskKey, "任务标识不能为空");
        // 获取或创建任务对应的锁信息
        TaskLockInfo lockInfo = getOrCreateTaskLockInfo(taskKey, fair);
        boolean acquired;
        try {
            if (acquireTimeout <= 0 || acquireUnit == null) {
                // 无超时等待（阻塞直到获取锁）
                lockInfo.lock.lockInterruptibly();
                acquired = true;
            } else {
                // 带超时等待
                acquired = lockInfo.lock.tryLock(acquireTimeout, acquireUnit);
            }
        } catch (InterruptedException e) {
            // 获取锁中断，清理计数
            releaseLockCount(taskKey);
            throw e;
        }

        if (!acquired) {
            // 获取锁超时，清理计数
            releaseLockCount(taskKey);
            throw new TimeoutException("获取任务[" + taskKey + "]的锁超时");
        }

        // 成功获取锁，更新活动时间
        lockInfo.updateActiveTime();
    }

    /**
     * 释放指定任务的锁
     *
     * @param taskKey 任务标识
     * @throws IllegalMonitorStateException 未持有锁时抛出
     */
    public void unlock(Object taskKey) {
        Objects.requireNonNull(taskKey, "任务标识不能为空");

        TaskLockInfo lockInfo = taskLocks.get(taskKey);
        if (lockInfo == null) {
            throw new IllegalMonitorStateException("未持有任务[" + taskKey + "]的锁");
        }

        // 检查当前线程是否持有锁（防止释放其他线程的锁）
        if (!lockInfo.lock.isHeldByCurrentThread()) {
            throw new IllegalMonitorStateException("线程[" + Thread.currentThread().getName() + "]未持有任务[" + taskKey + "]的锁");
        }
        // 释放锁
        lockInfo.lock.unlock();
        // 减少重入计数，计数为0时移除锁信息（避免内存泄漏）
        releaseLockCount(taskKey);
    }

    /**
     * 尝试获取锁（非阻塞，立即返回）
     *
     * @param taskKey 任务标识
     * @return 是否获取成功
     */
    public boolean tryLock(Object taskKey) {
        return tryLock(taskKey, 0, TimeUnit.MILLISECONDS, false);
    }

    /**
     * 尝试获取锁（带超时）
     *
     * @param taskKey 任务标识
     * @param timeout 超时时间
     * @param unit    时间单位
     * @param fair    是否公平锁
     * @return 是否获取成功
     */
    public boolean tryLock(Object taskKey, long timeout, TimeUnit unit, boolean fair) {
        try {
            lock(taskKey, timeout, unit, fair);
            return true;
        } catch (InterruptedException | TimeoutException e) {
            return false;
        }
    }

    /**
     * 检查当前线程是否持有指定任务的锁
     *
     * @param taskKey 任务标识
     * @return 是否持有
     */
    public boolean isHoldingLock(Object taskKey) {
        TaskLockInfo lockInfo = taskLocks.get(taskKey);
        return lockInfo != null && lockInfo.lock.isHeldByCurrentThread();
    }

    /**
     * 获取当前被锁定的任务数量（监控用）
     */
    public int getLockedTaskCount() {
        return taskLocks.size();
    }

//    /**
//     * 关闭资源（释放超时检查线程池）
//     */
//    public void shutdown() {
//        timeoutExecutor.shutdown();
//        try {
//            if (!timeoutExecutor.awaitTermination(1, TimeUnit.SECONDS)) {
//                timeoutExecutor.shutdownNow();
//            }
//        } catch (InterruptedException e) {
//            timeoutExecutor.shutdownNow();
//        }
//    }

//    /**
//     * 检查并释放超时的锁（防止死锁）
//     */
//    private void checkAndReleaseTimeoutLocks() {
//        long now = System.currentTimeMillis();
//        long timeoutMillis = defaultTimeUnit.toMillis(defaultHoldTimeout);
//
//        for (TaskLockInfo lockInfo : taskLocks.values()) {
//            // 计算超时时间：当前时间 - 最后活动时间 > 超时阈值
//            if (now - lockInfo.lastActiveTime > timeoutMillis && lockInfo.lock.isLocked()) {
//                // 强制释放超时锁（日志记录建议替换为日志框架）
//                System.err.printf("任务[%s]的锁持有超时（%dms），强制释放（可能导致数据不一致）%n", lockInfo.taskKey, timeoutMillis);
//                lockInfo.lock.unlock(); // ReentrantLock允许非持有线程解锁（需谨慎）
//                releaseLockCount(lockInfo.taskKey);
//            }
//        }
//    }

    /**
     * 获取或创建任务锁信息（核心逻辑，处理并发创建）
     */
    private TaskLockInfo getOrCreateTaskLockInfo(Object taskKey, boolean fair) {
        // 先尝试获取已有锁
        TaskLockInfo existing = taskLocks.get(taskKey);
        if (existing != null) {
            existing.holdCount.incrementAndGet(); // 重入计数+1
            return existing;
        }

        // 不存在则创建新锁
        TaskLockInfo newLockInfo = new TaskLockInfo(taskKey, fair);
        // 使用putIfAbsent避免并发创建重复锁
        TaskLockInfo oldLockInfo = taskLocks.putIfAbsent(taskKey, newLockInfo);
        if (oldLockInfo != null) {
            // 并发场景下，其他线程已创建锁，使用旧锁并更新计数
            oldLockInfo.holdCount.incrementAndGet();
            return oldLockInfo;
        } else {
            return newLockInfo;
        }
    }

    /**
     * 释放锁计数（计数为0时移除锁信息）
     */
    private void releaseLockCount(Object taskKey) {
        TaskLockInfo lockInfo = taskLocks.get(taskKey);
        if (lockInfo == null) {
            return;
        }

        int remaining = lockInfo.holdCount.decrementAndGet();
        if (remaining <= 0) {
            // 计数为0，移除锁信息（释放内存）
            taskLocks.remove(taskKey);
        }
    }
}
