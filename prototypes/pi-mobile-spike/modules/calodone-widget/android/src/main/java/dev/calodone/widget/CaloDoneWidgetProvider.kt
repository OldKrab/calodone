package dev.calodone.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.net.Uri
import android.widget.RemoteViews

class CaloDoneWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
      data = Uri.parse("calodone://capture")
      flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP
    } ?: return
    val pendingIntent = PendingIntent.getActivity(
      context,
      4101,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    for (widgetId in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.calodone_widget).apply {
        setOnClickPendingIntent(R.id.calodone_widget_root, pendingIntent)
      }
      appWidgetManager.updateAppWidget(widgetId, views)
    }
  }
}
