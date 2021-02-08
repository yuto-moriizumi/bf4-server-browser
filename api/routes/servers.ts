import express from "express";
import { Builder, By, Key, until } from "selenium-webdriver";

const router = express.Router();

// サーバリストを取得
router.get("/", async (req, res) => {
  const driver = await new Builder()
    .forBrowser("chrome")
    .usingServer("http://selenium:4444/wd/hub")
    .build();
  try {
    await driver.get(
      "https://battlelog.battlefield.com/bf4/ja/servers/pc/?filtered=1&expand=1&settings=&useLocation=1&useAdvanced=1&gameexpansions=-1&slots=1&slots=2&slots=4&q=&gameexpansions=-1&gameexpansions=-1&gameexpansions=-1&gameexpansions=-1&gameexpansions=-1&mapRotation=-1&modeRotation=-1&password=-1&regions=1&regions=32&osls=-1&vvsa=-1&vffi=-1&vaba=-1&vkca=-1&v3ca=-1&v3sp=-1&vmsp=-1&vrhe=-1&vhud=-1&vmin=-1&vnta=-1&vbdm-min=1&vbdm-max=300&vprt-min=1&vprt-max=300&vshe-min=1&vshe-max=300&vtkk-min=1&vtkk-max=99&vnit-min=30&vnit-max=86400&vtkc-min=1&vtkc-max=99&vvsd-min=0&vvsd-max=500&vgmc-min=0&vgmc-max=500"
    );
    const el_results_container = await driver.findElement(By.id("results-container"));
    const el_tbody = await driver.findElement(By.xpath("//tbody"));
    const el_server_trs = await driver.findElements(By.xpath("//tr"));
    const tr_texts = (
      await Promise.all(
        el_server_trs.map(async (el) => {
          const guid = await el.getAttribute("data-guid");
          if (!guid) return null;
          const texts = (await el.getText()).split("\n");
          return {
            guid: guid,
            img: await (await el.findElement(By.xpath("//td/div/img"))).getAttribute(
              "src"
            ),
            name: texts[0],
            details: texts[1],
            players: texts[2].slice(0, -2),
          };
        })
      )
    ).filter((tr) => tr); //falsyなアイテム(タイトルとフッター)を除外
    res.send(tr_texts);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  } finally {
    await driver.quit();
  }
});

//サーバのチームとチケット数を返す
router.get("/:guid", async (req, res) => {
  const guid = req.params.guid;
  console.log(`######## ${guid}`);

  const driver = await new Builder()
    .forBrowser("chrome")
    .usingServer("http://selenium:4444/wd/hub")
    .build();
  try {
    await driver.get(`https://battlelog.battlefield.com/bf4/ja/servers/show/pc/${guid}`);
    const scores = (
      await Promise.all(
        (await driver.findElements(By.xpath("//th[@colspan='2']"))).map(
          async (el) => await el.getText()
        )
      )
    ).map((score) => {
      const text_parts = score.split(" - ");
      return { name: text_parts[0], ticket: parseInt(text_parts[1]) };
    });
    res.send(scores);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  } finally {
    await driver.quit();
  }
});

export default router;
